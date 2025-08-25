'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/upload/FileUpload';
import { Download, Copy, FileText, Clock, Target } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SummaryResult {
  summary: string;
  highlights: {
    keywords: string[];
    names: string[];
    dates: string[];
  };
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
}

export default function DocumentSummarizer() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [summaryType, setSummaryType] = useState('short');
  const [customLength, setCustomLength] = useState(200);
  const [tone, setTone] = useState('neutral');
  const [error, setError] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError('');
    setCurrentFile(file);
    setSummaryResult(null);

    try {
      let extractionResult;

      // Try client-side extraction for TXT files only
      if (file.type === 'text/plain') {
        try {
          const text = await file.text();
          if (!text || text.trim().length === 0) {
            throw new Error('No text could be extracted from the file');
          }
          
          const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
          extractionResult = {
            text: text.length > 100000 ? text.substring(0, 100000) + '...' : text,
            wordCount,
            fileType: file.type,
            fileName: file.name,
            fileSize: file.size
          };
          setExtractedText(extractionResult.text);
          setIsProcessing(false);
          return;
        } catch (clientError) {
          console.warn('Client-side extraction failed, trying server-side:', clientError);
          // Fall through to server-side processing
        }
      }

      // Server-side processing for DOCX or fallback
      const formData = new FormData();
      formData.append('file', file);

      // If we have extracted text from client-side, send it along
      if (extractionResult?.text) {
        formData.append('extractedText', extractionResult.text);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process file');
      }

      setExtractedText(result.text);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarize = async () => {
    if (!extractedText) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: extractedText,
          summaryType,
          customLength: summaryType === 'custom' ? customLength : undefined,
          tone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate summary');
      }

      setSummaryResult(result);
      
      // Save to Firestore
      if (user && currentFile) {
        try {
          await addDoc(collection(db, 'summaries'), {
            userId: user.uid,
            fileName: currentFile.name,
            fileSize: currentFile.size,
            fileType: currentFile.type,
            originalText: extractedText.substring(0, 1000), // Store first 1000 chars
            summary: result.summary,
            summaryType,
            tone,
            customLength: summaryType === 'custom' ? customLength : null,
            originalWordCount: result.originalWordCount,
            summaryWordCount: result.summaryWordCount,
            compressionRatio: result.compressionRatio,
            highlights: result.highlights,
            createdAt: serverTimestamp(),
          });
        } catch (firestoreError) {
          console.error('Failed to save to Firestore:', firestoreError);
          // Don't show error to user as summary still worked
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Document</h2>
        <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
      </div>

      {/* Summarization Options */}
      {extractedText && !summaryResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summarization Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Type
              </label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 appearance-none"
              >
                <option value="short">Short Summary (1-2 paragraphs)</option>
                <option value="bullet">Bullet Points</option>
                <option value="custom">Custom Length</option>
              </select>
            </div>

            {/* Custom Length */}
            {summaryType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Word Count
                </label>
                <input
                  type="number"
                  value={customLength}
                  onChange={(e) => setCustomLength(parseInt(e.target.value))}
                  min="50"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 appearance-none"
              >
                <option value="neutral">Neutral</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="academic">Academic</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={isProcessing}
            className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Generating Summary...' : 'Generate Summary'}
          </button>
        </div>
      )}

      {/* Summary Results */}
      {summaryResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Summary Results</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(summaryResult.summary)}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </button>
              <button
                onClick={() => downloadAsText(summaryResult.summary, `${currentFile?.name}_summary.txt`)}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <FileText className="h-4 w-4 text-gray-800 mr-1" />
              </div>
              <p className="text-sm font-medium text-gray-800">Original</p>
              <p className="text-lg font-bold text-gray-900">{summaryResult.originalWordCount} words</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-4 w-4 text-gray-800 mr-1" />
              </div>
              <p className="text-sm font-medium text-gray-800">Summary</p>
              <p className="text-lg font-bold text-gray-900">{summaryResult.summaryWordCount} words</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-gray-800 mr-1" />
              </div>
              <p className="text-sm font-medium text-gray-800">Compression</p>
              <p className="text-lg font-bold text-gray-900">{summaryResult.compressionRatio}%</p>
            </div>
          </div>

          {/* Summary Text */}
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-800">{summaryResult.summary}</p>
            </div>
          </div>

          {/* Highlights */}
          {(summaryResult.highlights.keywords.length > 0 || 
            summaryResult.highlights.names.length > 0 || 
            summaryResult.highlights.dates.length > 0) && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Key Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summaryResult.highlights.keywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {summaryResult.highlights.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {summaryResult.highlights.names.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Names</h4>
                    <div className="flex flex-wrap gap-1">
                      {summaryResult.highlights.names.map((name, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {summaryResult.highlights.dates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Dates</h4>
                    <div className="flex flex-wrap gap-1">
                      {summaryResult.highlights.dates.map((date, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                        >
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}

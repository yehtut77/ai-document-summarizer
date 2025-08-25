'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Search, FileText, Calendar, Trash2, Download, Copy, Clock, Target } from 'lucide-react';

interface HistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  summary: string;
  summaryType: string;
  tone: string;
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  highlights: {
    keywords: string[];
    names: string[];
    dates: string[];
  };
  createdAt: { toDate?: () => Date } | Date | string;
}

export default function HistoryDashboard() {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'summaries'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: HistoryItem[] = [];
      
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        } as HistoryItem);
      });
      
      setHistoryItems(items);
      setFilteredItems(items);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(historyItems);
    } else {
      const filtered = historyItems.filter(item =>
        item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, historyItems]);


  const deleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'summaries', itemId));
      setHistoryItems(prev => prev.filter(item => item.id !== itemId));
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string) => {
    if (!timestamp) return 'Unknown date';
    let date: Date;
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Document History ({filteredItems.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No matching documents' : 'No documents yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search terms' : 'Upload your first document to see it here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* History List */}
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedItem?.id === item.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.fileName}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      <span>{formatFileSize(item.fileSize)}</span>
                      <span className="capitalize">{item.summaryType}</span>
                      <span className="capitalize">{item.tone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Item Details */}
          <div className="lg:sticky lg:top-6">
            {selectedItem ? (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedItem.fileName}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(selectedItem.summary)}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={() => downloadAsText(selectedItem.summary, `${selectedItem.fileName}_summary.txt`)}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <FileText className="h-4 w-4 text-gray-800 mr-1" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">Original</p>
                    <p className="text-lg font-bold text-gray-900">{selectedItem.originalWordCount} words</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-gray-800 mr-1" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">Summary</p>
                    <p className="text-lg font-bold text-gray-900">{selectedItem.summaryWordCount} words</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-gray-800 mr-1" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">Compression</p>
                    <p className="text-lg font-bold text-gray-900">{selectedItem.compressionRatio}%</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Summary</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedItem.summary}</p>
                  </div>
                </div>

                {/* Highlights */}
                {(selectedItem.highlights.keywords.length > 0 || 
                  selectedItem.highlights.names.length > 0 || 
                  selectedItem.highlights.dates.length > 0) && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Key Highlights</h5>
                    <div className="space-y-3">
                      {selectedItem.highlights.keywords.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-gray-700 mb-1">Keywords</h6>
                          <div className="flex flex-wrap gap-1">
                            {selectedItem.highlights.keywords.map((keyword, index) => (
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
                      {selectedItem.highlights.names.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-gray-700 mb-1">Names</h6>
                          <div className="flex flex-wrap gap-1">
                            {selectedItem.highlights.names.map((name, index) => (
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
                      {selectedItem.highlights.dates.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-gray-700 mb-1">Dates</h6>
                          <div className="flex flex-wrap gap-1">
                            {selectedItem.highlights.dates.map((date, index) => (
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
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">Select a document to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

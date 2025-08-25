'use client';

import { useState, useEffect } from 'react';
import { Upload, Clock, Search, FileText } from 'lucide-react';
import DocumentSummarizer from '@/components/summarizer/DocumentSummarizer';
import HistoryDashboard from '@/components/history/HistoryDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('upload');
  const [stats, setStats] = useState({
    documentsProcessed: 0,
    timeSaved: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'summaries'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let totalDocuments = 0;
      let totalTimeSaved = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalDocuments++;
        // Estimate time saved: assume 1 minute per 100 words of original text
        const estimatedReadingTime = Math.ceil((data.originalWordCount || 0) / 100);
        totalTimeSaved += estimatedReadingTime;
      });
      
      setStats({
        documentsProcessed: totalDocuments,
        timeSaved: totalTimeSaved
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to AI Document Summarizer
          </h1>
          <p className="text-gray-600">
            Upload your documents and get AI-powered summaries in seconds
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'upload'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'history'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              History
            </button>
          </nav>
        </div>

        {/* Content Area */}
        {activeTab === 'upload' && (
          <DocumentSummarizer />
        )}

        {activeTab === 'history' && (
          <HistoryDashboard />
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Documents Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.documentsProcessed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Saved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.timeSaved} min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, FileText, Menu, X } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <FileText className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                AI Document Summarizer
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-3">
                  {user.photoURL && (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {user && (
                <>
                  <div className="flex items-center space-x-3 px-3 py-2">
                    {user.photoURL && (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut className="h-4 w-4 mr-2 inline" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * ClerkErrorBoundary - Catches Clerk initialization errors
 * 
 * If Clerk fails to initialize (e.g., invalid key), this boundary
 * catches the error and displays a helpful message instead of crashing
 */

import { Component, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

interface ClerkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ClerkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ClerkErrorBoundary extends Component<ClerkErrorBoundaryProps, ClerkErrorBoundaryState> {
  constructor(props: ClerkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ClerkErrorBoundaryState {
    // Check if this is a Clerk-related error
    const isClerkError = 
      error.message?.includes('publishableKey') ||
      error.message?.includes('Clerk') ||
      error.message?.includes('@clerk/clerk-react');
    
    if (isClerkError) {
      return { hasError: true, error };
    }
    
    // Re-throw non-Clerk errors
    return { hasError: false, error: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Clerk Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="ml-3 text-2xl font-bold text-gray-900">Clerk Configuration Error</h1>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-700 mb-4">
                  The application cannot start because Clerk authentication is not properly configured.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-red-800 font-semibold mb-2">Error Details:</p>
                  <p className="text-sm text-red-700 font-mono">{this.state.error?.message || 'Unknown error'}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-800 font-semibold mb-2">How to Fix:</p>
                  <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2">
                    <li>Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Vercel Dashboard</a></li>
                    <li>Select your project → <strong>Settings</strong> → <strong>Environment Variables</strong></li>
                    <li>Add <code className="bg-blue-100 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code></li>
                    <li>Get your key from <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Clerk Dashboard</a></li>
                    <li>Redeploy your application</li>
                  </ol>
                </div>

                <div className="mt-6">
                  <a
                    href="https://github.com/mrcrochet/nucigenlabs-website/blob/a11y-seo-perf/QUICK_FIX_CLERK_VERCEL.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.747 5.754 18 7.5 18s3.332.747 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.747 18.247 18 16.5 18c-1.746 0-3.332.747-4.5 1.253" />
                    </svg>
                    View Setup Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </BrowserRouter>
      );
    }

    return this.props.children;
  }
}

export default ClerkErrorBoundary;

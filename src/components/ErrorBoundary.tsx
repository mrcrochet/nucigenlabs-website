import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { logErrorToTracker } from '../utils/error-tracker';
import { getUserFriendlyError } from '../utils/error-handling-client';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    logErrorToTracker(error, errorInfo);
    
    // Also send to Sentry with React component stack
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: true,
        retryCount: this.state.retryCount,
      },
    });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userMessage = getUserFriendlyError(this.state.error);
      const canRetry = this.state.retryCount < 3;

      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
          <div className="max-w-2xl w-full">
            <div className="mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-red-400 mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-slate-300 mb-4">
                    {userMessage}
                  </p>
                  
                  {this.props.showDetails && this.state.error && (
                    <details className="mt-4 text-xs text-slate-500">
                      <summary className="cursor-pointer hover:text-slate-400 mb-2">
                        Technical details
                      </summary>
                      <pre className="mt-2 p-3 bg-black/20 rounded overflow-auto">
                        {this.state.error.message}
                        {this.state.error.stack && (
                          <>
                            {'\n\n'}
                            {this.state.error.stack}
                          </>
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                {canRetry && (
                  <button
                    onClick={this.handleReset}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors text-sm font-light"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-light"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-light"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

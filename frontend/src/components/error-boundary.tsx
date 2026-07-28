'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-4">
              An unexpected error occurred in the application view.
            </p>
            {this.state.error && (
              <pre className="bg-slate-950 p-3 rounded text-left text-xs text-red-300 font-mono overflow-x-auto mb-4 border border-slate-800">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

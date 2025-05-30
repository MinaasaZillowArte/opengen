// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
    this.setState({ errorInfo });
    // Di sini Anda bisa mengirim log error ke layanan eksternal
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-[var(--bg-secondary)] text-[var(--text-primary)]">
          <h2 className="text-xl font-semibold text-red-500 dark:text-red-400">Oops! Something went wrong.</h2>
          <p className="text-[var(--text-secondary)] mt-2 mb-4">
            We're sorry for the inconvenience. Please try refreshing the page or starting a new chat.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left w-full max-w-lg">
              <summary className="cursor-pointer text-sm text-[var(--color-primary)]">Error Details</summary>
              <pre className="mt-2 text-xs bg-[var(--bg-tertiary)] p-3 rounded overflow-auto max-w-full whitespace-pre-wrap">
                {this.state.error.toString()}
                {this.state.errorInfo && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
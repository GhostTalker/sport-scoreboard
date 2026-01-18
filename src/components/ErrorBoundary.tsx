import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for catching unhandled React errors.
 * Prevents blank screens on video wall displays by showing a friendly error message.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * Or with custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught.
   * This static method is called during the "render" phase.
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  /**
   * Log error details for debugging.
   * This lifecycle method is called during the "commit" phase.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({ error, errorInfo });

    // Future enhancement: Send error to analytics/monitoring service
    // Example: sendToErrorTracking(error, errorInfo);
  }

  /**
   * Handle reload button click.
   * Performs a full page reload to attempt recovery.
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Handle reset state without full reload (for retry scenarios).
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI styled to match the app's design
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-slate-800 rounded-2xl p-8 text-center shadow-2xl border border-slate-700">
            {/* Warning Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-white mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-white/70 mb-8 leading-relaxed">
              The scoreboard encountered an unexpected error.
              <br />
              Please try reloading the app.
            </p>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-8 bg-slate-900 p-4 rounded-lg border border-slate-700">
                <summary className="cursor-pointer text-red-400 font-semibold mb-3 select-none">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                      Error Message
                    </span>
                    <pre className="text-red-300 text-sm mt-1 whitespace-pre-wrap break-words">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <span className="text-xs text-white/50 uppercase tracking-wider">
                        Stack Trace
                      </span>
                      <pre className="text-red-300/70 text-xs mt-1 overflow-x-auto whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <span className="text-xs text-white/50 uppercase tracking-wider">
                        Component Stack
                      </span>
                      <pre className="text-orange-300/70 text-xs mt-1 overflow-x-auto whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload App
              </button>

              {/* Try Again button (attempts to re-render without full reload) */}
              <button
                onClick={this.handleReset}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white/80 rounded-xl font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>

            {/* Footer */}
            <p className="mt-8 text-white/30 text-xs">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    // No error - render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;

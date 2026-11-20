import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('FinTrack Campus ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMessage =
        'Something went wrong while syncing your campus finance data. Please reload to continue.';
      if (this.state.errorMessage.includes('Missing or insufficient permissions')) {
        friendlyMessage =
          'Your session could not access this Firestore record due to security rule permissions. Please sign out and sign back in with a verified Google account.';
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <h1 className="text-xl font-semibold text-slate-900">Unable to load workspace</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{friendlyMessage}</p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Reload FinTrack Campus
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

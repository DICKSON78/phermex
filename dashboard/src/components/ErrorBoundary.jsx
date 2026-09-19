import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f5f7f5] flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Something went wrong</h2>
          <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            className="bg-[#0FD452] text-[#000F14] rounded-2xl font-bold text-sm px-6 py-3 flex items-center gap-2 active:scale-95"
          >
            <RefreshCw size={16} />
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

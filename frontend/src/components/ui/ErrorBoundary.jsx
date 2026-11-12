import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from './Button.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI exception in ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="antigravity-layout min-h-screen flex items-center justify-center p-6 text-center">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-md w-full flex flex-col items-center gap-4 shadow-glow">
            <span className="size-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle size={32} />
            </span>
            <h1 className="text-xl font-bold text-text-primary">
              Something went wrong
            </h1>
            <p className="text-xs text-text-muted leading-relaxed">
              An unexpected error occurred while rendering this interface. Please reload the page to restore your session.
            </p>
            <Button onClick={this.handleReload} size="sm" className="mt-2 flex items-center gap-1.5">
              <RotateCcw size={14} />
              <span>Reload Application</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

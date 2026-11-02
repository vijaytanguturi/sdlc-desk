import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Local-only logging: nothing is sent anywhere.
    console.error('SDLC Desk crashed', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <div className="crash__panel">
            <p className="eyebrow">Something went wrong</p>
            <h1 className="crash__title">SDLC Desk hit an unexpected error</h1>
            <p className="crash__text">
              Your saved work is stored separately in this browser and has not been deleted. Reload
              the page to continue. If the problem persists, export your data from Settings before
              clearing anything.
            </p>
            <pre className="crash__detail">{this.state.error.message}</pre>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Reload application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('RushBoard error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <p className="error-boundary-kicker">RushBoard</p>
          <h1 className="error-boundary-title">Something went wrong</h1>
          <p className="error-boundary-copy">
            Try refreshing the page. If the problem keeps happening, sign out and sign back in.
          </p>
          <div className="error-boundary-actions">
            <button className="error-boundary-refresh" onClick={() => window.location.reload()}>
              Refresh page
            </button>
            <a href="/" className="error-boundary-home">Go home</a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

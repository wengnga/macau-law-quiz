import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Error boundaries must be class components; shows the error instead of a blank page. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[app] 页面出错', error, info.componentStack);
  }

  private goHome = (): void => {
    window.location.hash = '#/';
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="splash">
        <p>页面出错了，做题记录不受影响。</p>
        <pre className="error-detail">{`${error.name}: ${error.message}\n${error.stack ?? ''}`.slice(0, 1500)}</pre>
        <div className="button-row">
          <button type="button" className="button button-ghost" onClick={this.goHome}>
            返回首页
          </button>
          <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
            重新加载
          </button>
        </div>
      </div>
    );
  }
}

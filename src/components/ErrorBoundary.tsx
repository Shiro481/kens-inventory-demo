import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches runtime errors anywhere in the React tree and
 * renders a friendly recovery screen instead of a blank white page.
 *
 * Usage: wrap <App /> (or any subtree) in <ErrorBoundary>.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — swap for a real error reporting service (Sentry etc.) when ready
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.subtitle}>
              An unexpected error occurred in the application. Your data is safe.
            </p>
            {this.state.error && (
              <pre style={styles.detail}>
                {this.state.error.message}
              </pre>
            )}
            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={this.handleReset}>
                Try Again
              </button>
              <button style={styles.secondaryBtn} onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Inline styles (no CSS file dependency so the fallback always renders) ──
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1117',
    padding: '24px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  card: {
    background: '#1a1d27',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '40px 36px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  icon: { fontSize: '2.5rem', marginBottom: '16px' },
  title: { color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 600, marginBottom: '10px' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' },
  detail: {
    background: '#0f1117',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#fca5a5',
    fontSize: '0.78rem',
    textAlign: 'left',
    overflowX: 'auto',
    marginBottom: '24px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  actions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  primaryBtn: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};

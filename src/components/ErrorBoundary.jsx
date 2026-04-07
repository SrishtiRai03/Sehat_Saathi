/**
 * @fileoverview React Error Boundary component.
 * Catches rendering errors in child components and displays a fallback UI
 * instead of crashing the entire application.
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px', padding: '40px', textAlign: 'center',
          background: 'var(--bg, #F5F3FF)',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: '#FFE8EA', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '32px',
          }}>
            ⚠️
          </div>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 700, color: '#1A1A2E' }}>
            Something went wrong
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#999', maxWidth: '340px' }}>
            An unexpected error occurred. Please refresh the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px', borderRadius: '24px',
              background: '#6B5CE7', color: 'white',
              fontFamily: 'Inter, sans-serif', fontWeight: 600,
              fontSize: '14px', border: 'none', cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

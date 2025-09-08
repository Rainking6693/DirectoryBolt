'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-danger-900/30 to-danger-800/20 border border-danger-500/30 rounded-xl p-8 max-w-lg w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-danger-400 mb-3">
              Something went wrong
            </h2>
            <p className="text-secondary-300 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 bg-secondary-800/50 p-4 rounded border border-secondary-600/30">
                <summary className="cursor-pointer font-medium text-danger-300 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-secondary-400 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-volt-500 to-volt-600 text-secondary-900 font-bold rounded-lg hover:from-volt-400 hover:to-volt-500 transition-all duration-300"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/'
                  }
                }}
                className="flex-1 px-4 py-3 border-2 border-volt-500 text-volt-500 font-bold rounded-lg hover:bg-volt-500 hover:text-secondary-900 transition-all duration-300"
              >
                🏠 Go Home
              </button>
            </div>
            
            <div className="mt-4 text-xs text-secondary-400">
              If this problem persists, please contact{' '}
              <a 
                href="mailto:support@directorybolt.com" 
                className="text-volt-400 hover:text-volt-300"
              >
                support@directorybolt.com
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
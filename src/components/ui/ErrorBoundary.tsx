// React class-based error boundary. Catches unhandled render errors and
// displays a full-page fallback with the error message and a reload button.
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b] p-4 select-none">
          <div className="max-w-md w-full bg-white dark:bg-[#121215] rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                An Unexpected Exception Occurred
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                The application encountered an unhandled state. You can refresh the view to restore stability.
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06] rounded-xl p-3.5 max-h-32 overflow-y-auto text-left">
              <p className="text-xs font-mono tabular-nums text-rose-600 dark:text-rose-400 break-words leading-relaxed">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

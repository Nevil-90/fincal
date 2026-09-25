// Authentication page for forgot-password
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, ShieldAlert, ShieldCheck, KeyRound, Loader2, Sparkles } from 'lucide-react'

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Pre-fill email from URL query parameter if available
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    // Standard client-side regex email validation check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.toLowerCase().trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset')
      }

      setSuccessMessage(data.message || 'Security password reset link dispatched successfully!')
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 relative z-10">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.1] text-blue-600 dark:text-blue-400 shadow-sm">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Provide your email to receive a recovery reset link
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl">
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} method="POST">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                placeholder="you@example.com"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-40 transition-all shadow-sm cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Dispatching link...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#09090b] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Subtle ambient illumination */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] dark:bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="text-center text-slate-500 dark:text-zinc-400 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Loading validator...</p>
        </div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}

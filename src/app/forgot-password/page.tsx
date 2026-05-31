'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, ShieldAlert, ShieldCheck, KeyRound } from 'lucide-react'

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
    <div className="w-full max-w-md space-y-8 relative z-10">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight text-white animate-fade-in">
          Reset Password
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Provide your email to receive a secure password reset link
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 animate-slide-in">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 animate-slide-in">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} method="POST">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
              Email Address
            </label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-2xl border border-slate-800 bg-slate-950 pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all focus:outline-none"
                placeholder="you@example.com"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? 'Sending Request...' : 'Send Reset Link'}
          </button>

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <Suspense fallback={
        <div className="text-center text-slate-400 relative z-10 animate-pulse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm font-semibold">Loading security validator...</p>
        </div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}

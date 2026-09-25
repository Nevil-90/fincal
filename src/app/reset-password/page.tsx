// Authentication page for reset-password
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, ShieldAlert, ShieldCheck, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')

  // Pull token from URL queries
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    }
  }, [searchParams])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('A valid security reset token is missing. Please request a new link.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setPassword('')
      setConfirmPassword('')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setPassword('')
      setConfirmPassword('')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccessMessage(data.message || 'Your password has been successfully configured!')
      setPassword('')
      setConfirmPassword('')

      // Redirect user to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err: any) {
      setPassword('')
      setConfirmPassword('')
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
            Set New Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Configure a secure password for your account
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

        {!token ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              The reset token is missing or has expired. Please request a new security link from the recovery page.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Request New Link
            </Link>
          </div>
        ) : successMessage ? (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Password Configured</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {successMessage}
            </p>
            <div className="pt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Redirecting to sign in shortly...</span>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} method="POST">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] pl-10 pr-10 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                  placeholder="Min 8 characters"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] pl-10 pr-10 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                  placeholder="Re-enter password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
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
                  Configuring Password...
                </span>
              ) : (
                'Reset Password'
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
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#09090b] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Subtle ambient illumination */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] dark:bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="text-center text-slate-500 dark:text-zinc-400 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Loading token validator...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

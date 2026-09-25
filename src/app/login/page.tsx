// Authentication page for login
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, ShieldAlert, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import OtpInput from '@/components/ui/OtpInput'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Auth flow states
  const [step, setStep] = useState<'email' | 'password' | 'otp' | 'set-password'>('email')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [setupMessage, setSetupMessage] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Submit email to check user status
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.toLowerCase().trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), checkOnly: true })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Check email failed')
      }

      if (data.passwordSetupRequired) {
        setSetupMessage(data.message || 'OTP verification code sent.')
        setStep('otp')
      } else {
        setStep('password')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // 2. Submit password for normal login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.toLowerCase().trim())) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Successful login
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // 3. Verify OTP for password setup
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otpCode) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.toLowerCase().trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp: otpCode.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed')
      }

      setTempToken(data.token)
      setStep('set-password')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // 4. Configure new password
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword || !tempToken) return

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setNewPassword('')
      setConfirmPassword('')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setNewPassword('')
      setConfirmPassword('')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, token: tempToken })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to configure password')
      }

      // Automatically log in the user after password configuration
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password: newPassword })
      })

      if (loginResponse.ok) {
        setNewPassword('')
        setConfirmPassword('')
        router.push('/')
        router.refresh()
      } else {
        setNewPassword('')
        setConfirmPassword('')
        setStep('email')
        setError('Password setup successful! Please log in.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#09090b] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Subtle ambient illumination */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] dark:bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.1] text-blue-600 dark:text-blue-400 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Finacal
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Personal Wealth & Financial Ledger
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <form className="space-y-4" onSubmit={handleEmailSubmit} method="POST">
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
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-40 transition-all shadow-sm cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking identity...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                    Request access
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Enter Password (Normal Login) */}
          {step === 'password' && (
            <form className="space-y-4" onSubmit={handlePasswordSubmit} method="POST">
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email
                </button>
                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate max-w-[150px]">{email}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Password
                  </label>
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(email.toLowerCase().trim())}`}
                    prefetch={false}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] pl-10 pr-10 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                    placeholder="••••••••"
                    autoFocus
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

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 transition-all shadow-sm cursor-pointer"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* STEP 3: Enter OTP */}
          {step === 'otp' && (
            <form className="space-y-4" onSubmit={handleOtpVerify} method="POST">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                {setupMessage}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-2">
                  6-Digit Verification Code
                </label>
                <OtpInput value={otpCode} onChange={setOtpCode} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 transition-all shadow-sm cursor-pointer"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? 'Verifying Code...' : 'Verify Email'}
              </button>
            </form>
          )}

          {/* STEP 4: Configure Password */}
          {step === 'set-password' && (
            <form className="space-y-4" onSubmit={handlePasswordSetup} method="POST">
              <div className="text-xs text-slate-700 dark:text-zinc-300 mb-1">
                Configure your password for <span className="text-blue-600 dark:text-blue-400 font-semibold">{email}</span>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] pl-10 pr-10 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                    placeholder="Min 8 characters"
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                    placeholder="Confirm password"
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
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 transition-all shadow-sm cursor-pointer"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? 'Configuring Security...' : 'Complete Account Setup'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#09090b] text-slate-500 dark:text-zinc-400">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Loading security validator...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

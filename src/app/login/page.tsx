// Authentication page for login
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, ShieldAlert, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-white">
            FinTracker
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Secure Personal Financial Intelligence
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <form className="space-y-6" onSubmit={handleEmailSubmit} method="POST">
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
                    className="block w-full rounded-2xl border border-slate-800 bg-slate-950 pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-xs text-slate-500">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-bold text-blue-400 hover:text-blue-300">
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Enter Password (Normal Login) */}
          {step === 'password' && (
            <form className="space-y-6" onSubmit={handlePasswordSubmit} method="POST">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Email
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300">
                  Email
                </label>
                <div className="mt-1 text-sm font-bold text-blue-400">
                  {email}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                    Password
                  </label>
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(email.toLowerCase().trim())}`}
                    prefetch={false}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-800 bg-slate-950 pl-12 pr-12 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                    placeholder="••••••••"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* STEP 3: Enter OTP */}
          {step === 'otp' && (
            <form className="space-y-6" onSubmit={handleOtpVerify} method="POST">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
              </div>

              <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-xs text-blue-400">
                {setupMessage}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  6-Digit Verification Code
                </label>
                <OtpInput value={otpCode} onChange={setOtpCode} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Verifying Code...' : 'Verify Email'}
              </button>
            </form>
          )}

          {/* STEP 4: Configure Password */}
          {step === 'set-password' && (
            <form className="space-y-6" onSubmit={handlePasswordSetup} method="POST">
              <div className="text-sm text-slate-300 mb-2 font-semibold">
                Setup your password for <span className="text-blue-400 font-bold">{email}</span>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-300">
                  New Password
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-800 bg-slate-950 pl-12 pr-12 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors focus:outline-none"
                    placeholder="Min 8 characters"
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300">
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-800 bg-slate-950 pl-12 pr-12 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors focus:outline-none"
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-lg"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm font-semibold">Loading security check...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}


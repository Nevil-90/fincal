// Authentication page for register
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, ShieldAlert, ArrowRight, ArrowLeft, MessageSquare, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import OtpInput from '@/components/ui/OtpInput'

export default function RegisterPage() {
  const router = useRouter()

  // Registration Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verification & Password Flow State
  const [step, setStep] = useState<'register' | 'otp' | 'set-password'>('register')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [setupMessage, setSetupMessage] = useState('')
  
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 1. Submit Registration Form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !email || !reason) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, reason })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSetupMessage(data.message || 'OTP verification code sent.')
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Submit OTP
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otpCode) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed')
      }

      setTempToken(data.token)
      setStep('set-password')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 3. Configure password
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword || !tempToken) return

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
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

      // Automatically log in the user after setting the password
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword })
      })

      if (loginResponse.ok) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/login')
      }
    } catch (err: any) {
      setError(err.message)
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
              Create an Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Join Finacal to manage personal cashflow, goals, and travel
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 'register' && (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Usage / Referral Note
                </label>
                <div className="relative">
                  <MessageSquare className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <textarea
                    id="reason"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="block w-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs transition-colors resize-none"
                    placeholder="Personal finance & travel fuel log..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 transition-all shadow-sm cursor-pointer mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 'otp' && (
            <form className="space-y-4" onSubmit={handleOtpVerify}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('register')}
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

          {/* STEP 3: Configure Password */}
          {step === 'set-password' && (
            <form className="space-y-4" onSubmit={handlePasswordSetup}>
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

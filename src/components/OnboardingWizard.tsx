'use client'

import { useState } from 'react'
import { X, Sparkles, Target, CreditCard, ChevronRight, Check, DollarSign, PartyPopper, Rocket } from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'

interface OnboardingWizardProps {
  user: { firstName: string; lastName: string; email: string }
  onComplete: () => void
}

const STEPS = [
  { id: 1, title: 'Welcome', icon: Sparkles },
  { id: 2, title: 'Opening Balance', icon: DollarSign },
  { id: 3, title: 'Monthly Goal', icon: Target },
  { id: 4, title: "You're Set!", icon: Check },
]

export default function OnboardingWizard({ user, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [openingBalance, setOpeningBalance] = useState('')
  const [monthlySpendingGoal, setMonthlySpendingGoal] = useState('')
  const [loading, setLoading] = useState(false)

  useScrollLock(true)

  const handleFinish = async () => {
    setLoading(true)
    try {
      // If user entered an opening balance, create an income transaction
      if (openingBalance && parseFloat(openingBalance) > 0) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'income',
            amount: parseFloat(openingBalance),
            category: 'Opening Balance',
            description: 'Opening Balance',
            date: new Date().toISOString().split('T')[0],
          }),
        })
      }

      // Save monthly spending goal to user settings
      if (monthlySpendingGoal && parseFloat(monthlySpendingGoal) > 0) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'monthlySpendingGoal',
            value: monthlySpendingGoal
          })
        })
      }

      // Mark onboarding as complete on the server
      await fetch('/api/user/complete-onboarding', { method: 'POST' })

      onComplete()
    } catch {
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    await fetch('/api/user/complete-onboarding', { method: 'POST' })
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md">
      <div className="bg-white dark:bg-[#121215] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 dark:border-white/[0.08]">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-white/[0.06]">
          <div
            className="h-1 bg-blue-500 transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 pt-5 px-6">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step > s.id
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : step === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-white/[0.06]'
              }`}>
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              {s.id < STEPS.length && (
                <div className={`h-0.5 w-8 rounded-full transition-all ${step > s.id ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-white/[0.06]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-500 dark:text-blue-400 shadow-sm">
                <Sparkles className="h-7 w-7 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  Welcome, {user.firstName}! <PartyPopper className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </h2>
                <p className="mt-1.5 text-slate-500 dark:text-zinc-400 text-xs leading-relaxed">
                  Let's take 60 seconds to set up your financial baseline. This helps Finacal give you meaningful insights from day one.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {[
                  { icon: DollarSign, label: 'Track Balance', color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' },
                  { icon: Target, label: 'Set Goals', color: 'text-blue-500 dark:text-blue-400 bg-blue-500/10' },
                  { icon: CreditCard, label: 'Log Expenses', color: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 text-center">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Opening Balance */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 dark:text-emerald-400">
                  <DollarSign className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">What's your opening balance?</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Enter approximately how much money you have available right now. This sets your financial starting point.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 dark:text-zinc-500">₹</span>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-3 text-xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all text-center tabular-nums"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center">You can skip this and add it later.</p>
            </div>
          )}

          {/* Step 3: Monthly Goal */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-500 dark:text-blue-400">
                  <Target className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                </div>
                <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">Set a monthly spending limit</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  How much do you want to spend each month? We'll track your progress and alert you when you're approaching the limit.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 dark:text-zinc-500">₹</span>
                <input
                  type="number"
                  value={monthlySpendingGoal}
                  onChange={(e) => setMonthlySpendingGoal(e.target.value)}
                  placeholder="20,000"
                  className="w-full pl-9 pr-4 py-3 text-xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all text-center tabular-nums"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center">You can change this anytime in Settings.</p>
            </div>
          )}

          {/* Step 4: All Done */}
          {step === 4 && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 dark:text-emerald-400">
                <Check className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">You're all set! <Rocket className="h-5 w-5 text-blue-500 dark:text-blue-400" /></h2>
                <p className="mt-1.5 text-slate-500 dark:text-zinc-400 text-xs leading-relaxed">
                  Your Finacal is ready. Start logging your first transaction — every rupee tracked is a step toward financial clarity.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06] rounded-xl p-3.5 text-left space-y-2 text-xs">
                {openingBalance && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>Opening balance of <strong className="text-slate-900 dark:text-white tabular-nums">₹{parseFloat(openingBalance).toLocaleString('en-IN')}</strong> will be logged</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>Auto-categorization is active</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>Monthly insights will appear at month-end</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step < 4 && (
              <button
                onClick={handleSkip}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-all"
              >
                Skip Setup
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 transition-all"
              >
                {loading ? 'Setting up...' : <span className="flex items-center justify-center gap-1.5">Start Tracking! <PartyPopper className="h-4 w-4" /></span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

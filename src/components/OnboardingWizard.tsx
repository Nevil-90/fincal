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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-neutral-800">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-neutral-800">
          <div
            className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 pt-5 px-6">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id
                  ? 'bg-emerald-500 text-white'
                  : step === s.id
                  ? 'bg-blue-600 text-white scale-110 shadow-md'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500'
              }`}>
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              {s.id < STEPS.length && (
                <div className={`h-0.5 w-8 rounded-full transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-neutral-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="p-7">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  <span className="flex items-center gap-2">Welcome, {user.firstName}! <PartyPopper className="h-6 w-6 text-indigo-500 dark:text-indigo-400" /></span>
                </h2>
                <p className="mt-2 text-slate-500 dark:text-neutral-400 text-sm leading-relaxed">
                  Let's take 60 seconds to set up your financial baseline. This helps Finacal give you meaningful insights from day one.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: DollarSign, label: 'Track Balance', color: 'text-emerald-600 bg-emerald-50' },
                  { icon: Target, label: 'Set Goals', color: 'text-purple-600 bg-purple-50' },
                  { icon: CreditCard, label: 'Log Expenses', color: 'text-blue-600 bg-blue-50' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-neutral-300 text-center">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Opening Balance */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">What's your opening balance?</h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-neutral-400">
                  Enter approximately how much money you have available right now. This sets your financial starting point.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 dark:text-neutral-500">₹</span>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-4 text-2xl font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-950 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 outline-none transition-all text-center"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-neutral-500 text-center">You can skip this and add it later.</p>
            </div>
          )}

          {/* Step 3: Monthly Goal */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-200 dark:shadow-none">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Set a monthly spending limit</h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-neutral-400">
                  How much do you want to spend each month? We'll track your progress and alert you when you're approaching the limit.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 dark:text-neutral-500">₹</span>
                <input
                  type="number"
                  value={monthlySpendingGoal}
                  onChange={(e) => setMonthlySpendingGoal(e.target.value)}
                  placeholder="20,000"
                  className="w-full pl-10 pr-4 py-4 text-2xl font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-950 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 outline-none transition-all text-center"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-neutral-500 text-center">You can change this anytime in Settings.</p>
            </div>
          )}

          {/* Step 4: All Done */}
          {step === 4 && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none">
                <Check className="h-9 w-9 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">You're all set! <Rocket className="h-6 w-6 text-indigo-500 dark:text-indigo-400" /></h2>
                <p className="mt-2 text-slate-500 dark:text-neutral-400 text-sm leading-relaxed">
                  Your Finacal is ready. Start logging your first transaction — every rupee tracked is a step toward financial clarity.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-2xl p-4 text-left space-y-2">
                {openingBalance && (
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>Opening balance of <strong className="dark:text-white">₹{parseFloat(openingBalance).toLocaleString('en-IN')}</strong> will be logged</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>Auto-categorization is active</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>Monthly insights will appear at month-end</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-7">
            {step < 4 && (
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all"
              >
                Skip Setup
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-bold shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl text-sm font-bold shadow-md hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Setting up...' : <span className="flex items-center justify-center gap-2">Start Tracking! <PartyPopper className="h-4 w-4" /></span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

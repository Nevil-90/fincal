'use client'

import React, { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { Search, CreditCard, Target, PieChart, RefreshCw, Settings, Shield, Plus, Moon, Sun, Monitor, Car, ArrowLeft, DollarSign, Tag, CornerDownLeft, Type, Calendar as CalendarIcon, FileText } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { mutate } from 'swr'
import { toast } from 'sonner'

interface CommandPaletteProps {
  onNavigate: (tab: string) => void
  onAddTransaction: () => void
  onTransactionAdded?: () => void
  isAdmin?: boolean
}

type FlowStep = 'root' | 'add_type' | 'add_amount' | 'add_category' | 'add_source' | 'add_method' | 'add_date' | 'add_note'

export default function CommandPalette({ onNavigate, onAddTransaction, onTransactionAdded, isAdmin }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { data: staticData } = useEnhancedStaticData()

  const [step, setStep] = useState<FlowStep>('root')
  const [txType, setTxType] = useState<'income' | 'expense' | null>(null)
  const [txAmount, setTxAmount] = useState<number | null>(null)
  const [txCategory, setTxCategory] = useState<string | null>(null)
  const [txSource, setTxSource] = useState<string | null>(null)
  const [txMethod, setTxMethod] = useState<string | null>(null)
  const [txDate, setTxDate] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset state when palette closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('root')
        setTxType(null)
        setTxAmount(null)
        setTxCategory(null)
        setTxSource(null)
        setTxMethod(null)
        setTxDate(null)
        setInputValue('')
      }, 200) // wait for exit animation
    }
  }, [open])

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    setMounted(true)
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const goBack = () => {
    if (step === 'add_type') setStep('root')
    if (step === 'add_amount') setStep('add_type')
    if (step === 'add_category') setStep('add_amount')
    if (step === 'add_source') setStep('add_category')
    if (step === 'add_method') setStep('add_source')
    if (step === 'add_date') setStep('add_method')
    if (step === 'add_note') setStep('add_date')
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && inputValue === '') {
      e.preventDefault()
      goBack()
    }

    if (e.key === 'Enter') {
      if (step === 'add_amount') {
        const amt = parseFloat(inputValue.replace(/[^0-9.]/g, ''))
        if (!isNaN(amt) && amt > 0) {
          setTxAmount(amt)
          setStep('add_category')
          setInputValue('')
          e.preventDefault()
        } else {
          toast.error("Please enter a valid amount")
        }
      } else if (step === 'add_source') {
        // Optional step
        e.preventDefault()
        setTxSource(inputValue.trim() || null)
        setStep('add_method')
        setInputValue('')
      } else if (step === 'add_date') {
        // If they typed a custom date string, try to parse it
        if (inputValue.trim()) {
          const parsed = new Date(inputValue.trim())
          if (!isNaN(parsed.getTime()) && inputValue.trim().length >= 8 && inputValue.includes('-')) {
            setTxDate(parsed.toISOString().split('T')[0])
            setStep('add_note')
            setInputValue('')
            e.preventDefault()
          }
        }
      } else if (step === 'add_note') {
        e.preventDefault()
        submitTransaction(inputValue.trim() || null)
      }
    }
  }

  const submitTransaction = async (note: string | null) => {
    if (!txType || !txAmount || !txCategory || !txMethod || !txDate) return

    setIsSubmitting(true)
    try {
      const payload = {
        type: txType,
        amount: txAmount,
        category: txCategory,
        paymentMethod: txMethod,
        source: txSource,
        description: note,
        date: txDate
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to save transaction')

      toast.success(`Added ${txType === 'income' ? '+' : '-'}$${txAmount} for ${txCategory}`)
      mutate(key => typeof key === 'string' && key.startsWith('/api/transactions')) // Globally refresh SWR
      onTransactionAdded?.()
      setOpen(false)
    } catch (error) {
      toast.error('Failed to log transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) return null

  const categories = txType === 'income' ? (staticData?.incomeCategories || []) : txType === 'expense' ? (staticData?.expenseCategories || []) : []
  const sources = txType === 'income' ? (staticData?.incomeSources || []) : txType === 'expense' ? (staticData?.expensePurposes || []) : []
  const methods = staticData?.paymentMethods || []

  // Create a clean summary string instead of many bulky badges
  const getSummaryText = () => {
    const parts = []
    if (txType) parts.push(txType === 'income' ? 'Income' : 'Expense')
    if (txAmount) parts.push(`$${txAmount}`)
    if (txCategory) parts.push(txCategory)
    if (txSource) parts.push(txSource)
    if (txMethod) parts.push(`via ${txMethod}`)
    return parts.join(' • ')
  }

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        aria-describedby={undefined}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] sm:pt-[25vh] bg-slate-900/40 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity animate-in fade-in"
      >
        <div className="w-[90%] max-w-[600px] overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-slate-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200 relative">
          
          {isSubmitting && (
            <div className="absolute inset-0 z-50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          )}

          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <DialogDescription className="sr-only">Search for commands and quick actions</DialogDescription>
          
          <Command 
            className="w-full"
            onKeyDown={handleKeyDown}
          >
            <div className="flex flex-col border-b border-slate-100 dark:border-neutral-800">
              
              {/* Clean Summary Bar (replaces the ugly badges) */}
              {step !== 'root' && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                    {getSummaryText() || 'New Transaction'}
                  </span>
                  <span className="text-[10px] text-slate-400">Step {['add_type','add_amount','add_category','add_source','add_method','add_date','add_note'].indexOf(step) + 1} of 7</span>
                </div>
              )}

              <div className="flex items-center px-3 h-14 overflow-x-hidden">
                {step === 'root' ? (
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                ) : (
                  <button onClick={goBack} className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-md shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}

                <Command.Input
                  value={inputValue}
                  onValueChange={setInputValue}
                  placeholder={
                    step === 'root' ? "Type a command or search..." :
                    step === 'add_type' ? "Select type..." :
                    step === 'add_amount' ? "Enter amount and press Return..." :
                    step === 'add_category' ? "Select category..." :
                    step === 'add_source' ? (txType === 'expense' ? 'Select purpose (or press Return to skip)...' : 'Select source (or press Return to skip)...') :
                    step === 'add_method' ? 'Select payment method...' :
                    step === 'add_date' ? "Select a date or type YYYY-MM-DD..." :
                    step === 'add_note' ? "Enter note or press Return to skip..." : ""
                  }
                  className="w-full bg-transparent px-3 py-4 text-sm sm:text-base outline-none text-slate-900 dark:text-white placeholder:text-slate-400 ml-1 min-w-[200px]"
                  autoFocus
                />
                
                <div className="hidden sm:flex text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 shrink-0">
                  {step === 'add_amount' || step === 'add_source' || step === 'add_date' || step === 'add_note' ? '↵ ENTER' : 'ESC'}
                </div>
              </div>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-800">
              <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
                {step === 'add_amount' ? 'Type an amount and hit Enter' : 
                 step === 'add_date' ? 'Hit Enter to use Today\'s date' :
                 step === 'add_note' ? 'Hit Enter to finish saving' : 'No results found.'}
              </Command.Empty>

              {/* STEP: ROOT */}
              {step === 'root' && (
                <>
                  <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    <Command.Item
                      onSelect={() => {
                        setStep('add_type')
                        setInputValue('')
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-400 transition-colors"
                    >
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded-md"><Plus className="h-4 w-4" /></div>
                      <span className="font-semibold">Quick Add Transaction</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-normal">Guided</span>
                    </Command.Item>
                    
                    <Command.Item
                      onSelect={() => runCommand(onAddTransaction)}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                    >
                      <div className="p-1 bg-slate-100 dark:bg-neutral-800 rounded-md"><Type className="h-4 w-4 text-slate-500" /></div>
                      <span>Open Full Add Form</span>
                    </Command.Item>
                  </Command.Group>

                  <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mt-2">
                    {[
                      { id: 'overview', label: 'Dashboard Overview', icon: PieChart },
                      { id: 'transactions', label: 'Transaction History', icon: CreditCard },
                      { id: 'goals', label: 'Savings Goals', icon: Target },
                      { id: 'recurring', label: 'Recurring Payments', icon: RefreshCw },
                      { id: 'traveling', label: 'Travel Expenses', icon: Car },
                      { id: 'settings', label: 'Application Settings', icon: Settings },
                    ].map((item) => (
                      <Command.Item
                        key={item.id}
                        onSelect={() => runCommand(() => onNavigate(item.id))}
                        className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                      >
                        <item.icon className="h-4 w-4 text-slate-400" />
                        <span>Go to {item.label}</span>
                      </Command.Item>
                    ))}
                    {isAdmin && (
                      <Command.Item
                        onSelect={() => runCommand(() => onNavigate('admin'))}
                        className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-rose-50 aria-selected:text-rose-700 dark:aria-selected:bg-rose-900/20 dark:aria-selected:text-rose-400 transition-colors"
                      >
                        <Shield className="h-4 w-4 text-rose-500" />
                        <span className="font-semibold">Go to Admin Panel</span>
                      </Command.Item>
                    )}
                  </Command.Group>

                  <Command.Group heading="Preferences" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mt-2">
                    <Command.Item
                      onSelect={() => runCommand(() => setTheme('light'))}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                    >
                      <Sun className="h-4 w-4 text-slate-400" />
                      <span>Light Theme</span>
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => setTheme('dark'))}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                    >
                      <Moon className="h-4 w-4 text-slate-400" />
                      <span>Dark Theme</span>
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => setTheme('system'))}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                    >
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <span>System Theme</span>
                    </Command.Item>
                  </Command.Group>
                </>
              )}

              {/* STEP: ADD_TYPE */}
              {step === 'add_type' && (
                <Command.Group heading="Transaction Type" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  <Command.Item
                    onSelect={() => { setTxType('expense'); setStep('add_amount'); setInputValue(''); }}
                    className="flex items-center gap-3 px-3 py-3 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-rose-50 aria-selected:text-rose-700 dark:aria-selected:bg-rose-900/20 dark:aria-selected:text-rose-400 transition-colors"
                  >
                    <div className="p-1.5 bg-rose-100 dark:bg-rose-900/40 rounded-md"><CreditCard className="h-4 w-4" /></div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">Expense</span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">Money leaving your account</span>
                    </div>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { setTxType('income'); setStep('add_amount'); setInputValue(''); }}
                    className="flex items-center gap-3 px-3 py-3 mt-2 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-emerald-50 aria-selected:text-emerald-700 dark:aria-selected:bg-emerald-900/20 dark:aria-selected:text-emerald-400 transition-colors"
                  >
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-md"><DollarSign className="h-4 w-4" /></div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">Income</span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">Money entering your account</span>
                    </div>
                  </Command.Item>
                </Command.Group>
              )}

              {/* STEP: ADD_AMOUNT */}
              {step === 'add_amount' && (
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Type the amount and press Enter</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">Press Backspace on an empty input to go back</p>
                </div>
              )}

              {/* STEP: ADD_CATEGORY */}
              {step === 'add_category' && (
                <Command.Group heading="Select Category" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  {categories.map((cat) => (
                    <Command.Item
                      key={cat.id}
                      onSelect={() => {
                        setTxCategory(cat.name)
                        setStep('add_source')
                        setInputValue('')
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                    >
                      <Tag className="h-4 w-4 text-slate-400" />
                      <span>{cat.name}</span>
                      <CornerDownLeft className="h-3 w-3 text-slate-300 dark:text-neutral-600 ml-auto" />
                    </Command.Item>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-xs text-slate-500 px-3 py-2">No categories found for this type.</p>
                  )}
                </Command.Group>
              )}

              {/* STEP: ADD_SOURCE */}
              {step === 'add_source' && (
                <Command.Group heading={txType === 'expense' ? 'Purpose (Optional)' : 'Income Source (Optional)'} className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  {sources.map((sourceItem) => (
                    <Command.Item
                      key={sourceItem.id}
                      onSelect={() => {
                        setTxSource(sourceItem.name)
                        setStep('add_method')
                        setInputValue('')
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                    >
                      <Target className="h-4 w-4 text-slate-400" />
                      <span>{sourceItem.name}</span>
                      <CornerDownLeft className="h-3 w-3 text-slate-300 dark:text-neutral-600 ml-auto" />
                    </Command.Item>
                  ))}
                  <p className="text-xs text-slate-500 px-3 py-2 mt-2 border-t border-slate-100 dark:border-neutral-800 pt-2">Press Enter to skip</p>
                </Command.Group>
              )}

              {/* STEP: ADD_METHOD */}
              {step === 'add_method' && (
                <Command.Group heading="Payment Method" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  {methods.map((method) => (
                    <Command.Item
                      key={method.id}
                      onSelect={() => {
                        setTxMethod(method.name)
                        setStep('add_date')
                        setInputValue('')
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      <span>{method.name}</span>
                      <CornerDownLeft className="h-3 w-3 text-slate-300 dark:text-neutral-600 ml-auto" />
                    </Command.Item>
                  ))}
                  {methods.length === 0 && (
                    <p className="text-xs text-slate-500 px-3 py-2">No methods found for this type.</p>
                  )}
                </Command.Group>
              )}

              {/* STEP: ADD_DATE */}
              {step === 'add_date' && (
                <Command.Group heading="Select Date" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  {[0, 1, 2, 3, 4, 5, 6].map((daysAgo) => {
                    const d = new Date()
                    d.setDate(d.getDate() - daysAgo)
                    const dateValue = d.toISOString().split('T')[0]
                    const label = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'long' })
                    const subtitle = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    
                    return (
                      <Command.Item
                        key={dateValue}
                        onSelect={() => {
                          setTxDate(dateValue)
                          setStep('add_note')
                          setInputValue('')
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-neutral-800 transition-colors"
                      >
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold">{label}</span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400 ml-2">{subtitle}</span>
                        <CornerDownLeft className="h-3 w-3 text-slate-300 dark:text-neutral-600 ml-auto" />
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              )}

              {/* STEP: ADD_NOTE */}
              {step === 'add_note' && (
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Add an optional note</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">Press Enter to save transaction</p>
                </div>
              )}

            </Command.List>
          </Command>
        </div>
      </Command.Dialog>
    </>
  )
}

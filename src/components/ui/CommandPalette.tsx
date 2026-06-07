'use client'

import React, { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { Search, CreditCard, Target, PieChart, RefreshCw, Settings, Shield, Plus, Moon, Sun, Monitor, Car } from 'lucide-react'
import { useTheme } from 'next-themes'

interface CommandPaletteProps {
  onNavigate: (tab: string) => void
  onAddTransaction: () => void
  isAdmin?: boolean
}

export default function CommandPalette({ onNavigate, onAddTransaction, isAdmin }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

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

  if (!mounted) return null

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        aria-describedby={undefined}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] sm:pt-[25vh] bg-slate-900/40 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity animate-in fade-in"
      >
        <div className="w-[90%] max-w-[600px] overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-slate-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <DialogDescription className="sr-only">Search for commands and quick actions</DialogDescription>
          <Command className="w-full">
            <div className="flex items-center border-b border-slate-100 dark:border-neutral-800 px-3">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <Command.Input
                placeholder="Type a command or search..."
                className="w-full bg-transparent p-4 text-base outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <div className="hidden sm:flex text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700">ESC</div>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-800">
              <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
                No results found.
              </Command.Empty>

              <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <Command.Item
                  onSelect={() => runCommand(onAddTransaction)}
                  className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-slate-700 dark:text-neutral-200 rounded-lg cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-400 transition-colors"
                >
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded-md"><Plus className="h-4 w-4" /></div>
                  <span className="font-semibold">Add New Transaction</span>
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
            </Command.List>
          </Command>
        </div>
      </Command.Dialog>
    </>
  )
}

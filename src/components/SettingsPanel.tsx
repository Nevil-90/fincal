'use client'

import { useState, useMemo, useEffect } from 'react'

import { useTheme } from 'next-themes'

import { Plus, Edit2, Trash2, Download, Upload, Eye, EyeOff, Save, X, Tag, PiggyBank, CreditCard, Briefcase, Compass, DollarSign, Search, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BookOpen, AlertTriangle, LayoutTemplate, ArrowUp, ArrowDown, BarChart3, Target, RefreshCw, PieChart, Calendar, Car, Shield, GripHorizontal, Lightbulb, Moon, Sun, Monitor, Palette, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { NavSettingsDnd } from './NavSettingsDnd'
import { useEnhancedStaticData, StaticDataType, StaticDataItem, BudgetItem } from '@/lib/enhanced-static-data-manager'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useNavPreferences } from '@/hooks/useNavPreferences'
import { SpreadsheetEditor } from './ui/SpreadsheetEditor'
import CustomSelect from '@/components/ui/CustomSelect'
import IconPicker from './ui/IconPicker'
import { getCategoryVisual, CATEGORY_ICON_MAP } from '@/lib/category-icons'

interface EditingItem {
  type: StaticDataType
  id: string | null
  name: string
  isActive: boolean
  isSystem?: boolean
  iconId?: string
  // Budget-specific fields
  amount?: number
  period?: 'monthly' | 'yearly'
  category?: string
}

interface SettingsPanelProps {
  onDataChange?: () => void
  isAdmin?: boolean
  isOpen: boolean
  onClose: () => void
}

export type SettingsSection = StaticDataType | 'navigation' | 'travelSettings' | 'dataBackup' | 'appearance'

const DEFAULT_PRESETS: Partial<Record<StaticDataType, { label: string; items: string[] }>> = {
  expenseCategories: {
    label: 'Expense Categories',
    items: [
      'Food & Dining', 'Groceries', 'Transportation', 'Shopping',
      'Bills & Utilities', 'Entertainment', 'Healthcare', 'Other'
    ]
  },
  incomeCategories: {
    label: 'Income Categories',
    items: [
      'Salary', 'Freelance', 'Business Income', 'Other'
    ]
  },
  paymentMethods: {
    label: 'Payment Methods',
    items: ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking']
  },
  incomeSources: {
    label: 'Income Sources',
    items: [
      'Primary Job', 'Freelance', 'Business', 'Other'
    ]
  },
  expensePurposes: {
    label: 'Expense Purposes',
    items: [
      'Personal', 'Family', 'Business', 'Other'
    ]
  }
}

function TravelSettingsPanel({ data, manager }: { data: any, manager: any }) {
  const existingPrice = data.userSettings?.defaultFuelPrice || ''
  const [localPrice, setLocalPrice] = useState(existingPrice)

  // Update local state if external data changes
  useEffect(() => {
    setLocalPrice(existingPrice)
  }, [existingPrice])

  const handleSavePrice = () => {
    const val = parseFloat(String(localPrice))
    if (!isNaN(val) && val > 0) {
      manager.saveSetting('defaultFuelPrice', String(val))
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 dark:border-white/[0.06] pb-4">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Travel Settings</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Configure default fuel price and auto-calculation overrides.</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">Default Fuel Price (per liter)</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value)}
                onBlur={handleSavePrice}
                className="w-full pl-7 pr-3 py-2 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 bg-white dark:bg-[#121215] text-slate-900 dark:text-white text-base sm:text-xs tabular-nums outline-none"
                placeholder="e.g. 99.50"
              />
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-500">Saved automatically on blur.</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Override Auto-Calculation</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">If enabled, you must manually enter both Amount and Liters when adding a fuel log.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={data.userSettings?.overrideTravelCalc === 'true'}
              onChange={(e) => {
                const val = e.target.checked ? 'true' : 'false'
                manager.saveSetting('overrideTravelCalc', val)
              }}
            />
            <div className="w-10 h-5 bg-slate-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

function AppearanceSettingsPanel() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 dark:border-white/[0.06] pb-4">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Appearance</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Customize the interface theme.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { id: 'light', label: 'Light Mode', icon: Sun },
          { id: 'dark', label: 'Dark Mode', icon: Moon },
          { id: 'system', label: 'System Settings', icon: Monitor },
        ].map((t) => {
          const Icon = t.icon
          const isActive = theme === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center justify-center p-5 border rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-white shadow-xs' 
                  : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-white/[0.16] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`h-6 w-6 mb-2.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SettingsPanel({ onDataChange, isAdmin, isOpen, onClose }: SettingsPanelProps) {
  const { data, manager, isLoading: isDataLoading, error } = useEnhancedStaticData()
  const { slots, updateSlots, isLoading: isNavLoading } = useNavPreferences()
  const [activeSection, setActiveSection] = useState<SettingsSection>('expenseCategories')
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [importData, setImportData] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingPresets, setIsLoadingPresets] = useState(false)
  
  // Drag and drop import states
  const [isDragging, setIsDragging] = useState(false)
  const [parsedPreview, setParsedPreview] = useState<{
    transactions: number
    savingsGoals: number
    monthlyBudgets: number
    staticDataCategories: number
    recurringTransactions: number
  } | null>(null)
  const [importMode, setImportMode] = useState<'preview' | 'spreadsheet'>('preview')
  const [editableData, setEditableData] = useState<Record<string, any[]> | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleLoadPresets = async (type: StaticDataType) => {
    const config = DEFAULT_PRESETS[type]
    if (!config) return
    setIsLoadingPresets(true)
    const toastId = toast.loading(`Loading ${config.label}...`)
    try {
      let added = 0
      for (const name of config.items) {
        const existing = ((data as any)[type] || []).some((item: any) => item.name.toLowerCase() === name.toLowerCase())
        if (!existing) {
          await manager.create(type as any, name)
          added++
        }
      }
      onDataChange?.()
      toast.success(`Loaded ${added} default ${type === 'expensePurposes' ? 'expense purposes' : 'items'}!`, { id: toastId })
    } catch (err) {
      console.error('Failed to load presets:', err)
      toast.error('Failed to load presets', { id: toastId })
    } finally {
      setIsLoadingPresets(false)
    }
  }

  const customIcons = useMemo(() => {
    try {
      return JSON.parse(data.userSettings?.custom_category_icons || '{}')
    } catch {
      return {}
    }
  }, [data.userSettings?.custom_category_icons])

  useScrollLock(!!editingItem || showImport || isOpen)

  const sectionMeta: Record<StaticDataType, { label: string; description: string; icon: any }> = {
    expenseCategories: {
      label: 'Expense Categories',
      description: 'System-wide categories for classification of expenses.',
      icon: Tag
    },
    incomeCategories: {
      label: 'Income Categories',
      description: 'Categories for classification of incoming revenue.',
      icon: PiggyBank
    },
    paymentMethods: {
      label: 'Payment Methods',
      description: 'Payment accounts, credit cards, or digital wallets.',
      icon: CreditCard
    },
    incomeSources: {
      label: 'Income Sources',
      description: 'Entities or clients representing revenue origins.',
      icon: Briefcase
    },
    expensePurposes: {
      label: 'Expense Purposes',
      description: 'Direct projects or motivations for purchases.',
      icon: Compass
    },
    budgetAmounts: {
      label: 'Budget Settings',
      description: 'Monthly and annual budget thresholds by category.',
      icon: DollarSign
    }
  }


  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section)
    setSearchQuery('')
    setIsMobileMenuOpen(false)
  }

  const handleSave = async () => {
    if (!editingItem) return

    if (editingItem.id) {
      const originalItem = (data[editingItem.type as keyof typeof data] as any[])?.find(i => i.id === editingItem.id)
      const isSystem = originalItem?.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(originalItem?.name || '')
      if (isSystem && originalItem && originalItem.name !== editingItem.name) {
        toast.error(`"${originalItem.name}" is a system category and cannot be renamed.`)
        return
      }
    }

    if (editingItem.type !== 'budgetAmounts' && editingItem.name) {
      const currentList = (data[editingItem.type as keyof typeof data] as any[]) || []
      const normalizeStem = (str: string) => {
        const clean = str.trim().toLowerCase()
        if (clean.length > 3 && clean.endsWith('s') && !clean.endsWith('ss')) {
          return clean.slice(0, -1)
        }
        return clean
      }
      const cleanStem = normalizeStem(editingItem.name)
      const duplicate = currentList.find(i =>
        i.id !== editingItem.id && (
          i.name.trim().toLowerCase() === editingItem.name.trim().toLowerCase() ||
          normalizeStem(i.name) === cleanStem
        )
      )
      if (duplicate) {
        toast.error(`Category "${duplicate.name}" is already added.`)
        return
      }
    }

    try {
      if (editingItem.id) {
        if (editingItem.type === 'budgetAmounts') {
          await manager.updateBudgetAmount(editingItem.id, {
            name: editingItem.name,
            isActive: editingItem.isActive,
            amount: editingItem.amount,
            period: editingItem.period,
            category: editingItem.category
          })
        } else {
          await manager.update(editingItem.type, editingItem.id, {
            name: editingItem.name,
            isActive: editingItem.isActive
          })
        }
      } else {
        if (editingItem.type === 'budgetAmounts') {
          if (editingItem.amount && editingItem.category) {
            await manager.createBudgetAmount(
              editingItem.name,
              editingItem.amount,
              editingItem.period || 'monthly',
              editingItem.category
            )
          }
        } else {
          await manager.create(editingItem.type, editingItem.name)
        }
      }
    } catch (err: any) {
      console.error('Failed to save item:', err)
      toast.error(err?.message || 'Failed to save item')
      return
    }

    if (editingItem.type === 'expenseCategories' || editingItem.type === 'incomeCategories') {
      try {
        const nextIcons = { ...customIcons }
        if (editingItem.id) {
          const originalItem = (data[editingItem.type as keyof typeof data] as any[])?.find(i => i.id === editingItem.id)
          if (originalItem && originalItem.name !== editingItem.name) {
            delete nextIcons[originalItem.name]
          }
        }
        if (editingItem.iconId) {
          nextIcons[editingItem.name] = editingItem.iconId
        }
        manager.saveSetting('custom_category_icons', JSON.stringify(nextIcons))
      } catch (err) {
        console.error('Failed to save custom category icon', err)
      }
    }

    setEditingItem(null)
    onDataChange?.()
  }

  const handleDelete = async (type: StaticDataType, id: string) => {
    const itemToDelete = (data[type as keyof typeof data] as any[])?.find(i => i.id === id)
    const isSystem = itemToDelete?.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(itemToDelete?.name || '')
    if (isSystem) {
      toast.error(`"${itemToDelete?.name}" is a locked system category required for core features and cannot be deleted.`)
      return
    }

    if (confirm('Are you sure you want to permanently delete this item?')) {
      if (itemToDelete && customIcons[itemToDelete.name]) {
        try {
          const nextIcons = { ...customIcons }
          delete nextIcons[itemToDelete.name]
          manager.saveSetting('custom_category_icons', JSON.stringify(nextIcons))
        } catch {}
      }

      try {
        if (type === 'budgetAmounts') {
          await manager.deleteBudgetAmount(id)
        } else {
          await manager.delete(type, id)
        }
        onDataChange?.()
      } catch (err: any) {
        console.error('Failed to delete item:', err)
        toast.error(err?.message || 'Failed to delete item')
      }
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/backup/export')
      if (!response.ok) throw new Error('Export failed')
      
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
      a.download = `finacal_backup_${dateStr}_${timeStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (customData?: any) => {
    setIsImporting(true)
    try {
      // Use the edited data if available, otherwise fallback to parsed importData
      const payloadData = customData || editableData || (importData ? JSON.parse(importData).data || JSON.parse(importData) : null)
      
      if (!payloadData) throw new Error('No data available to import')
      
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payloadData })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      toast.success('Data restored successfully! Refreshing local configurations...')
      setShowImport(false)
      setImportData('')
      setParsedPreview(null)
      setEditableData(null)
      
      await manager.refresh()
      onDataChange?.()
    } catch (error: any) {
      toast.error(`Restore failed: ${error.message || 'Invalid JSON format.'}`)
    } finally {
      setIsImporting(false)
    }
  }

  const parseAndPreviewJSON = (text: string) => {
    try {
      const parsed = JSON.parse(text)
      const actualData = parsed.data || parsed
      setImportData(text)
      setEditableData(actualData)
      setParsedPreview({
        transactions: actualData.transactions?.length || 0,
        savingsGoals: actualData.savingsGoals?.length || 0,
        monthlyBudgets: actualData.monthlyBudgets?.length || 0,
        staticDataCategories: actualData.staticDataCategories?.length || 0,
        recurringTransactions: actualData.recurringTransactions?.length || 0
      })
      toast.success('File parsed successfully! Review the data before applying.')
    } catch (e) {
      toast.error('Invalid JSON file format. Could not parse data.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please upload a valid .json file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => parseAndPreviewJSON(e.target?.result as string)
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please drop a valid .json file')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => parseAndPreviewJSON(event.target?.result as string)
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSaveAll = async () => {
    try {
      await manager.refresh()
      toast.success('All settings synchronized successfully with the database!')
      onDataChange?.()
    } catch (err) {
      toast.error(`Synchronization failed: ${err}`)
    }
  }

  const handleDeleteAll = () => {
    toast.error('Are you absolutely sure you want to reset the local cache?', {
      description: 'All local categories, budgets, and payment methods will be completely reset to your database configurations.',
      duration: 8000,
      action: {
        label: 'Confirm Reset',
        onClick: async () => {
          try {
            localStorage.removeItem('fincal_static_data')
            localStorage.removeItem('fintracker_static_data') // Legacy key
            toast.success('Local cache cleared. Restoring configurations from database...')
            await manager.refresh()
            onDataChange?.()
          } catch (err) {
            toast.error(`Failed to restore data: ${err}`)
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    })
  }

  const toggleItemStatus = async (type: StaticDataType, id: string, currentStatus: boolean) => {
    const item = (data[type as keyof typeof data] as any[])?.find(i => i.id === id)
    const isSystem = item?.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(item?.name || '')
    if (isSystem) {
      toast.error(`"${item?.name}" is a locked system category and must remain active.`)
      return
    }

    try {
      if (type === 'budgetAmounts') {
        await manager.updateBudgetAmount(id, { isActive: !currentStatus })
      } else {
        await manager.update(type, id, { isActive: !currentStatus })
      }
      onDataChange?.()
    } catch (err: any) {
      console.error('Failed to toggle item status:', err)
      toast.error(err?.message || 'Failed to update status')
    }
  }

  const filteredItems = useMemo(() => {
    if (activeSection === 'navigation' || activeSection === 'travelSettings' || activeSection === 'dataBackup' || activeSection === 'appearance') return []
    return ((data as any)[activeSection] || []).filter((item: any) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [data, activeSection, searchQuery])

  const { lockedItems, standardItems } = useMemo(() => {
    const isCategorySection = activeSection === 'expenseCategories' || activeSection === 'incomeCategories'
    if (!isCategorySection) {
      return { lockedItems: [], standardItems: filteredItems }
    }
    const locked: any[] = []
    const standard: any[] = []
    filteredItems.forEach((item: any) => {
      const isSystem = item.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(item.name)
      if (isSystem) {
        locked.push(item)
      } else {
        standard.push(item)
      }
    })
    return { lockedItems: locked, standardItems: standard }
  }, [filteredItems, activeSection])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 md:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div 
        className="relative w-full h-full sm:h-[640px] sm:max-h-[90vh] sm:max-w-4xl bg-white dark:bg-[#121215] sm:border border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col sm:rounded-2xl overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#16161a]/60 shadow-xs z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Manage preferences, categories, budgets & system configurations.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Mobile Accordion Header */}
          <div className="md:hidden bg-slate-50 dark:bg-[#16161a] border-b border-slate-200/80 dark:border-white/[0.06] p-3 z-10 sticky top-0">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-between w-full px-3.5 py-2.5 bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-900 dark:text-white shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                {(() => {
                  if (activeSection === 'appearance') return <><Palette className="h-4 w-4 text-violet-500 dark:text-violet-400"/> Appearance</>;
                  if (activeSection === 'navigation') return <><LayoutTemplate className="h-4 w-4 text-blue-500 dark:text-blue-400"/> Bottom Nav</>;
                  if (activeSection === 'travelSettings') return <><Car className="h-4 w-4 text-amber-500 dark:text-amber-400"/> Travel Config</>;
                  if (activeSection === 'dataBackup') return <><Download className="h-4 w-4 text-emerald-500 dark:text-emerald-400"/> Backup & Restore</>;
                  const meta = sectionMeta[activeSection as StaticDataType];
                  const Icon = meta?.icon || Settings;
                  return <><Icon className="h-4 w-4 text-blue-500 dark:text-blue-400"/> {meta?.label || 'Settings'}</>;
                })()}
              </div>
              {isMobileMenuOpen ? <ChevronUp className="h-4 w-4 text-slate-400 dark:text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-slate-400 dark:text-zinc-400" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div className={`w-full md:w-60 bg-slate-50/60 dark:bg-[#0e0e11] border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/[0.06] overflow-y-auto shrink-0 transition-all duration-300 md:max-h-full ${isMobileMenuOpen ? 'max-h-[50vh]' : 'max-h-0 md:max-h-full border-none md:border-solid md:border-r'}`}>
            <div className="flex flex-col p-3 gap-1">
              
              <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Data Classification
              </div>

              {Object.entries(sectionMeta).map(([key, meta]) => {
                const Icon = meta.icon
                const isSelected = activeSection === key
                const count = ((data as any)[key] || []).length
                return (
                  <button
                    key={key}
                    onClick={() => handleSectionChange(key as StaticDataType)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.08]' 
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                      <span className="truncate">{meta.label}</span>
                    </div>
                    <span className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                      count === 0 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                        : isSelected 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                          : 'bg-slate-200/60 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}

              <div className="px-3 pt-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                App Preferences
              </div>

              <button
                onClick={() => handleSectionChange('appearance')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'appearance'
                    ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Palette className={`h-3.5 w-3.5 shrink-0 ${activeSection === 'appearance' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span className="truncate">Appearance</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400">
                  Theme
                </span>
              </button>

              <button
                onClick={() => handleSectionChange('navigation')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'navigation'
                    ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutTemplate className={`h-3.5 w-3.5 shrink-0 ${activeSection === 'navigation' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span className="truncate">Bottom Nav</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400">
                  {slots.length} tabs
                </span>
              </button>

              <button
                onClick={() => handleSectionChange('travelSettings')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'travelSettings'
                    ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Car className={`h-3.5 w-3.5 shrink-0 ${activeSection === 'travelSettings' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span className="truncate">Travel Config</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400">
                  Fuel
                </span>
              </button>

              <button
                onClick={() => handleSectionChange('dataBackup')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSection === 'dataBackup'
                    ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Download className={`h-3.5 w-3.5 shrink-0 ${activeSection === 'dataBackup' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span className="truncate">Backup & Restore</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400">
                  JSON
                </span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white dark:bg-[#121215] flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {(isDataLoading || isNavLoading) ? (
                <div className="bg-slate-50 dark:bg-[#16161a] rounded-xl border border-slate-200/80 dark:border-white/[0.08] p-12 text-center shadow-sm animate-pulse">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 dark:border-white/20 border-t-blue-500"></div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400 font-medium">Loading configurations...</p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-5">
                  {activeSection === 'appearance' ? (
                    <AppearanceSettingsPanel />
                  ) : activeSection === 'dataBackup' ? (
                    <div className="space-y-5">
                      <div className="border-b border-slate-200/80 dark:border-white/[0.06] pb-4">
                        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Backup & Restore</h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Export your configurations or restore from a file.</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button onClick={handleExport} disabled={isExporting} className="w-full flex items-center gap-3 p-4 bg-white dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-left hover:border-blue-500/50 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer">
                          {isExporting ? (
                            <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
                          ) : (
                            <Download className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0" />
                          )}
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white">
                              {isExporting ? 'Exporting Data...' : 'Export Data'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                              {isExporting ? (
                                <span className="text-blue-500 dark:text-blue-400 font-medium">Please wait and do not refresh the page.</span>
                              ) : 'Download current settings to a JSON file.'}
                            </div>
                          </div>
                        </button>
                        <button onClick={() => setShowImport(!showImport)} className="w-full flex items-center gap-3 p-4 bg-white dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-left hover:border-emerald-500/50 shadow-sm transition-colors cursor-pointer">
                          <Upload className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white">Import Data</div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Upload and apply settings from a JSON file.</div>
                          </div>
                        </button>
                        <button onClick={handleDeleteAll} className="w-full flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-left hover:border-rose-300 dark:hover:border-rose-500/40 shadow-sm transition-colors cursor-pointer">
                          <Trash2 className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">Reset Local Cache</div>
                            <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Wipe local data and re-sync from main source.</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : activeSection === 'navigation' ? (
                    <NavSettingsDnd slots={slots} updateSlots={updateSlots} isAdmin={isAdmin} />
                  ) : activeSection === 'travelSettings' ? (
                    <TravelSettingsPanel data={data} manager={manager} />
                  ) : (
                    <>
                      {/* Section Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                              {sectionMeta[activeSection as StaticDataType]?.label}
                            </h2>
                            <span className="text-[10px] tabular-nums font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400">
                              {((data as any)[activeSection] || []).length} items
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                            {sectionMeta[activeSection as StaticDataType]?.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {((data as any)[activeSection] || []).length === 0 && DEFAULT_PRESETS[activeSection as StaticDataType] && (
                            <button
                              onClick={() => handleLoadPresets(activeSection as StaticDataType)}
                              disabled={isLoadingPresets}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                              <span>⚡</span> Presets
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const defaultItem = activeSection === 'budgetAmounts' 
                                ? { type: activeSection, id: null, name: '', isActive: true, amount: 0, period: 'monthly' as const, category: '' }
                                : { type: activeSection, id: null, name: '', isActive: true }
                              setEditingItem(defaultItem)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add
                          </button>
                        </div>
                      </div>

                      {/* Search Bar (only shown when items exist) */}
                      {((data as any)[activeSection] || []).length > 0 && (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${sectionMeta[activeSection as StaticDataType]?.label.toLowerCase()}...`}
                            className="w-full pl-8 pr-8 py-2 text-base sm:text-xs bg-slate-50/60 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 rounded-xl focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 outline-none shadow-xs"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Items List or Empty States */}
                      {filteredItems.length === 0 ? (
                        searchQuery.trim() !== '' ? (
                          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
                            <Search className="h-8 w-8 mx-auto text-slate-400 dark:text-zinc-600 mb-2.5" />
                            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">No items matching &ldquo;{searchQuery}&rdquo;</p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 mb-3">Try checking for typos or clear your search.</p>
                            <button
                              onClick={() => setSearchQuery('')}
                              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
                            >
                              Clear Search
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#16161a]/40 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400">
                              {(() => {
                                const MetaIcon = sectionMeta[activeSection as StaticDataType]?.icon || Tag
                                return <MetaIcon className="h-6 w-6" />
                              })()}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              No {sectionMeta[activeSection as StaticDataType]?.label} Configured
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1.5 mb-5 leading-relaxed">
                              {sectionMeta[activeSection as StaticDataType]?.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center justify-center gap-2.5">
                              {DEFAULT_PRESETS[activeSection as StaticDataType] && (
                                <button
                                  onClick={() => handleLoadPresets(activeSection as StaticDataType)}
                                  disabled={isLoadingPresets}
                                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                  {isLoadingPresets ? (
                                    <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <span>⚡</span>
                                  )}
                                  <span>Load {DEFAULT_PRESETS[activeSection as StaticDataType]?.items.length} Default Presets</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const defaultItem = activeSection === 'budgetAmounts'
                                    ? { type: activeSection, id: null, name: '', isActive: true, amount: 0, period: 'monthly' as const, category: '' }
                                    : { type: activeSection, id: null, name: '', isActive: true }
                                  setEditingItem(defaultItem)
                                }}
                                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-800 dark:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Custom {sectionMeta[activeSection as StaticDataType]?.label.slice(0, -1)}</span>
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="space-y-3.5">
                          {/* Locked / System Categories at the Top */}
                          {lockedItems.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                  <Lock className="w-3 h-3" />
                                  <span>System Categories (Locked)</span>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Core application flows</span>
                              </div>
                              <div className="space-y-2">
                                {lockedItems.map((item: any) => {
                                  const isCategory = activeSection === 'expenseCategories' || activeSection === 'incomeCategories'
                                  const visual = isCategory ? getCategoryVisual(item.name, activeSection === 'expenseCategories' ? 'EXPENSE' : 'INCOME', undefined, customIcons) : null
                                  const ItemIcon = visual?.icon
                                  const SectionIcon = sectionMeta[activeSection as StaticDataType]?.icon || Tag

                                  return (
                                    <div 
                                      key={item.id} 
                                      className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-xs ${
                                        item.isActive 
                                          ? 'bg-blue-50/20 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/30'
                                          : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/[0.03] opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        {isCategory && visual && ItemIcon ? (
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${visual.bgClass} ${visual.borderClass}`}>
                                            <ItemIcon className={`w-4 h-4 ${visual.colorClass}`} />
                                          </div>
                                        ) : (
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shrink-0 text-slate-500 dark:text-zinc-400">
                                            <SectionIcon className="w-3.5 h-3.5" />
                                          </div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.name}</span>
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                              <Lock className="w-2.5 h-2.5" /> Locked
                                            </span>
                                          </div>
                                          {isCategory && customIcons[item.name] && (
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Custom icon</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => setEditingItem({ ...item, type: activeSection as StaticDataType, iconId: customIcons[item.name] || (visual ? visual.id : undefined) })} className="p-1.5 text-slate-400 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors" title="Edit">
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="p-1.5 text-slate-300 dark:text-zinc-600 cursor-not-allowed" title="System categories cannot be deleted">
                                          <Lock className="h-3.5 w-3.5" />
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Subtle Separation */}
                          {lockedItems.length > 0 && standardItems.length > 0 && (
                            <div className="relative py-1.5 flex items-center">
                              <div className="grow border-t border-slate-200/80 dark:border-white/[0.08]" />
                              <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                <Tag className="w-3 h-3" /> Custom Categories ({standardItems.length})
                              </span>
                              <div className="grow border-t border-slate-200/80 dark:border-white/[0.08]" />
                            </div>
                          )}

                          {/* Standard / Custom Categories */}
                          {standardItems.length > 0 && (
                            <div className="space-y-2">
                              {standardItems.map((item: any) => {
                                const isCategory = activeSection === 'expenseCategories' || activeSection === 'incomeCategories'
                                const isSystem = item.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(item.name)
                                const visual = isCategory ? getCategoryVisual(item.name, activeSection === 'expenseCategories' ? 'EXPENSE' : 'INCOME', undefined, customIcons) : null
                                const ItemIcon = visual?.icon
                                const SectionIcon = sectionMeta[activeSection as StaticDataType]?.icon || Tag

                                return (
                                  <div 
                                    key={item.id} 
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-xs ${
                                      item.isActive 
                                        ? 'bg-white dark:bg-[#16161a] border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]'
                                        : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/[0.03] opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {isCategory && visual && ItemIcon ? (
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${visual.bgClass} ${visual.borderClass}`}>
                                          <ItemIcon className={`w-4 h-4 ${visual.colorClass}`} />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shrink-0 text-slate-500 dark:text-zinc-400">
                                          <SectionIcon className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.name}</span>
                                          {isSystem && (
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                              <Lock className="w-2.5 h-2.5" /> Locked
                                            </span>
                                          )}
                                          {!item.isActive && !isSystem && (
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400">Disabled</span>
                                          )}
                                        </div>
                                        {activeSection === 'budgetAmounts' && (
                                          <span className="text-[10px] tabular-nums font-medium text-slate-500 dark:text-zinc-400 mt-0.5">₹{item.amount.toLocaleString()} / {item.period} ({item.category})</span>
                                        )}
                                        {isCategory && customIcons[item.name] && (
                                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Custom icon</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {!isSystem ? (
                                        <button onClick={() => toggleItemStatus(activeSection as StaticDataType, item.id, item.isActive)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors" title={item.isActive ? "Disable" : "Enable"}>
                                          {item.isActive ? <Eye className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                                        </button>
                                      ) : null}
                                      <button onClick={() => setEditingItem({ ...item, type: activeSection as StaticDataType, iconId: customIcons[item.name] || (visual ? visual.id : undefined) })} className="p-1.5 text-slate-400 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors" title="Edit">
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      {!isSystem && (
                                        <button onClick={() => handleDelete(activeSection as StaticDataType, item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors" title="Delete">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md flex items-end sm:items-center justify-center z-[250] p-0 sm:p-4 animate-fadeIn" onClick={() => setEditingItem(null)}>
          <div className="bg-white dark:bg-[#121215] border-t sm:border border-slate-200 dark:border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 animate-slideUp sm:animate-none" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-300">
                {editingItem.id ? 'Edit' : 'Add New'} {editingItem.type as string === 'navigation' || editingItem.type as string === 'travelSettings' ? '' : sectionMeta[editingItem.type]?.label.slice(0, -1)}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {(() => {
                const isEditingSystem = Boolean(editingItem.id && (editingItem.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(editingItem.name)))
                return (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        disabled={isEditingSystem}
                        className={`w-full px-3.5 py-2 text-base sm:text-xs border rounded-xl outline-none transition font-medium ${
                          isEditingSystem
                            ? 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/[0.06] cursor-not-allowed'
                            : 'border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#16161a] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600'
                        }`}
                        placeholder={`Enter ${sectionMeta[editingItem.type].label.slice(0, -1).toLowerCase()} name`}
                        autoFocus={!isEditingSystem}
                      />
                      {isEditingSystem && (
                        <p className="mt-1.5 text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3 shrink-0" /> System category name is locked and required for core application flows.
                        </p>
                      )}
                    </div>

                    {/* Category Icon Customizer */}
                    {(editingItem.type === 'expenseCategories' || editingItem.type === 'incomeCategories') && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                          Category Icon
                        </label>
                        {(() => {
                          const currentVisual = getCategoryVisual(
                            editingItem.name || 'Category',
                            editingItem.type === 'expenseCategories' ? 'EXPENSE' : 'INCOME',
                            undefined,
                            editingItem.iconId ? { [editingItem.name || 'Category']: editingItem.iconId } : customIcons
                          )
                          const VisualIcon = currentVisual.icon
                          const isCustom = Boolean(editingItem.iconId || customIcons[editingItem.name])
                          return (
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#16161a] border border-slate-200 dark:border-white/[0.08] rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${currentVisual.bgClass} ${currentVisual.borderClass}`}>
                                  <VisualIcon className={`w-4 h-4 ${currentVisual.colorClass}`} />
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{currentVisual.label}</span>
                                    {isCustom && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Custom</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                                    {isCustom ? 'Custom icon selected' : 'Smart auto-resolved icon'}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowIconPicker(true)}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer"
                              >
                                Change Icon
                              </button>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                    
                    {!isEditingSystem && (
                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={editingItem.isActive}
                          onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                          className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#16161a] text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                        <label htmlFor="isActive" className="text-xs font-medium text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
                          Enable / Active Option
                        </label>
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Budget Amount Specific Fields */}
              {editingItem.type === 'budgetAmounts' && (
                <>
                  <div>
                    <CustomSelect
                      label="Link to Category"
                      selectSize="sm"
                      value={editingItem.category || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <optgroup label="System Defaults">
                        <option value="Subscriptions">Subscriptions</option>
                      </optgroup>
                      <optgroup label="Expense Categories">
                        {data.expenseCategories.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Income Categories">
                        {data.incomeCategories.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </optgroup>
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={editingItem.amount || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 text-base sm:text-xs border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#16161a] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 rounded-xl outline-none transition text-slate-900 dark:text-white font-medium tabular-nums"
                      placeholder="Enter budget threshold amount"
                      min="0"
                      step="100"
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Budget Period"
                      selectSize="sm"
                      value={editingItem.period || 'monthly'}
                      onChange={(e) => setEditingItem({ ...editingItem, period: e.target.value as 'monthly' | 'yearly' })}
                    >
                      <option value="monthly">Monthly Budget</option>
                      <option value="yearly">Yearly Budget</option>
                    </CustomSelect>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-2.5 mt-5 border-t border-slate-200/80 dark:border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  !editingItem.name.trim() || 
                  (editingItem.type === 'budgetAmounts' && (!editingItem.category?.trim() || !editingItem.amount || editingItem.amount <= 0))
                }
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Icon Picker Modal */}
      {showIconPicker && editingItem && (
        <IconPicker
          isOpen={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          currentIconId={editingItem.iconId || getCategoryVisual(editingItem.name || 'Category', editingItem.type === 'expenseCategories' ? 'EXPENSE' : 'INCOME', undefined, customIcons).id}
          categoryName={editingItem.name || 'Category'}
          onSelectIcon={(iconId) => {
            setEditingItem({
              ...editingItem,
              iconId
            })
            setShowIconPicker(false)
          }}
        />
      )}

      {/* Advanced Import Modal */}
      {showImport && importMode === 'preview' && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-fadeIn" onClick={() => { setShowImport(false); setImportData(''); }}>
          <div className="bg-white dark:bg-[#121215] border-t sm:border border-slate-200 dark:border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-2xl max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 transition-all duration-300 animate-slideUp sm:animate-none" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-white/[0.06] pb-3 mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-300">
                Import JSON Configurations
              </h3>
              <button
                type="button"
                onClick={() => { setShowImport(false); setImportData(''); }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {!parsedPreview ? (
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`w-full h-44 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] hover:border-slate-300 dark:hover:border-white/[0.16]'
                  }`}
                >
                  <Upload className={`h-7 w-7 mb-2.5 ${isDragging ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <p className="text-xs font-semibold text-slate-900 dark:text-white text-center px-4">
                    {isDragging ? 'Drop JSON file here' : 'Drag & drop your finacal backup JSON file here'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 mb-3 text-center">or click to browse from your computer</p>
                  <label className="px-3.5 py-1.5 text-xs font-medium bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 rounded-xl cursor-pointer transition-colors shadow-sm">
                    Select File
                    <input type="file" accept=".json,application/json" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.08] rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" /> Import Preview
                      </h4>
                      <div className="flex bg-slate-200/60 dark:bg-[#121215] p-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => setImportMode('preview')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm"
                        >
                          Visual Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportMode('spreadsheet')}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          Spreadsheet Editor
                        </button>
                      </div>
                    </div>

                    {importMode === 'preview' ? (
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="flex justify-between items-center p-2.5 bg-white dark:bg-[#121215] rounded-lg border border-slate-200/80 dark:border-white/[0.04] shadow-sm">
                          <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Transactions</span>
                          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{parsedPreview.transactions}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-white dark:bg-[#121215] rounded-lg border border-slate-200/80 dark:border-white/[0.04] shadow-sm">
                          <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Savings Goals</span>
                          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{parsedPreview.savingsGoals}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-white dark:bg-[#121215] rounded-lg border border-slate-200/80 dark:border-white/[0.04] shadow-sm">
                          <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Monthly Budgets</span>
                          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{parsedPreview.monthlyBudgets}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-white dark:bg-[#121215] rounded-lg border border-slate-200/80 dark:border-white/[0.04] shadow-sm">
                          <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Categories</span>
                          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{parsedPreview.staticDataCategories}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-normal font-medium">
                      <strong>Warning:</strong> Applying this import will securely wipe and replace your current data with the contents shown above. Make sure you have exported a recent backup if needed!
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2.5 mt-5 border-t border-slate-200/80 dark:border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={() => { setShowImport(false); setImportData(''); setParsedPreview(null); setEditableData(null); }}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleImport()}
                disabled={!parsedPreview || isImporting}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 min-w-[150px]"
              >
                {isImporting ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    Importing...
                  </>
                ) : (
                  'Confirm & Apply Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Editor Full Screen App */}
      {showImport && importMode === 'spreadsheet' && editableData && (
        <SpreadsheetEditor
          data={editableData}
          onCancel={() => setImportMode('preview')}
          onApply={(newData) => {
            setEditableData(newData)
            setParsedPreview({
              transactions: newData.transactions?.length || 0,
              savingsGoals: newData.savingsGoals?.length || 0,
              monthlyBudgets: newData.monthlyBudgets?.length || 0,
              staticDataCategories: newData.staticDataCategories?.length || 0,
              recurringTransactions: newData.recurringTransactions?.length || 0
            })
            // Execute import immediately from full-screen app
            handleImport(newData)
          }}
        />
      )}
    </div>
  )
}

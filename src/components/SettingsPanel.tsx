'use client'

import { useState, useMemo, useEffect } from 'react'

import { Plus, Edit2, Trash2, Download, Upload, Eye, EyeOff, Save, X, Tag, PiggyBank, CreditCard, Briefcase, Compass, DollarSign, Search, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BookOpen, AlertTriangle, LayoutTemplate, ArrowUp, ArrowDown, BarChart3, Target, RefreshCw, PieChart, Calendar, Car, Shield, GripHorizontal, Lightbulb } from 'lucide-react'
import { NavSettingsDnd } from './NavSettingsDnd'
import { useEnhancedStaticData, StaticDataType, StaticDataItem, BudgetItem } from '@/lib/enhanced-static-data-manager'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useNavPreferences } from '@/hooks/useNavPreferences'

interface EditingItem {
  type: StaticDataType
  id: string | null
  name: string
  isActive: boolean
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

const ALL_TABS = [
  { id: 'overview', icon: BarChart3, label: 'Overview' },
  { id: 'transactions', icon: CreditCard, label: 'Expenses' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'recurring', icon: RefreshCw, label: 'Recurring' },
  { id: 'analytics', icon: PieChart, label: 'Analytics' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'traveling', icon: Car, label: 'Traveling' },
  { id: 'settings', icon: Settings, label: 'Settings' }
]

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
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-lg font-bold text-slate-900">Travel Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure default fuel price and auto-calculation overrides.</p>
      </div>
      
      <div className="space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">Default Fuel Price (per liter)</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value)}
                onBlur={handleSavePrice}
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. 99.50"
              />
            </div>
            <span className="text-sm text-slate-500">Saved automatically on blur.</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Override Auto-Calculation</h4>
            <p className="text-xs text-slate-500 mt-1">If enabled, you must manually enter both Amount and Liters when adding a fuel log.</p>
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
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

export function SettingsPanel({ onDataChange, isAdmin, isOpen, onClose }: SettingsPanelProps) {
  const { data, manager, isLoading: isDataLoading, error } = useEnhancedStaticData()
  const { slots, updateSlots, isLoading: isNavLoading } = useNavPreferences()
  const [activeSection, setActiveSection] = useState<StaticDataType | 'navigation' | 'travelSettings'>('expenseCategories')
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [importData, setImportData] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  const handleSectionChange = (section: StaticDataType | 'navigation' | 'travelSettings') => {
    setActiveSection(section)
    setSearchQuery('')
    setIsMobileMenuOpen(false)
  }

  const handleSave = () => {
    if (!editingItem) return

    if (editingItem.id) {
      if (editingItem.type === 'budgetAmounts') {
        manager.updateBudgetAmount(editingItem.id, {
          name: editingItem.name,
          isActive: editingItem.isActive,
          amount: editingItem.amount,
          period: editingItem.period,
          category: editingItem.category
        })
      } else {
        manager.update(editingItem.type, editingItem.id, {
          name: editingItem.name,
          isActive: editingItem.isActive
        })
      }
    } else {
      if (editingItem.type === 'budgetAmounts') {
        if (editingItem.amount && editingItem.category) {
          manager.createBudgetAmount(
            editingItem.name,
            editingItem.amount,
            editingItem.period || 'monthly',
            editingItem.category
          )
        }
      } else {
        manager.create(editingItem.type, editingItem.name)
      }
    }

    setEditingItem(null)
    onDataChange?.()
  }

  const handleDelete = (type: StaticDataType, id: string) => {
    if (confirm('Are you sure you want to permanently delete this item?')) {
      if (type === 'budgetAmounts') {
        manager.deleteBudgetAmount(id)
      } else {
        manager.delete(type, id)
      }
      onDataChange?.()
    }
  }

  const handleExport = () => {
    const exportData = manager.export()
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fintracker-static-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (manager.import(importData)) {
      alert('Static settings data imported successfully!')
      setImportData('')
      setShowImport(false)
      onDataChange?.()
    } else {
      alert('Failed to import data. Please check the JSON format.')
    }
  }

  const handleSaveAll = async () => {
    try {
      await manager.refresh()
      alert('All settings synchronized successfully with the database!')
      onDataChange?.()
    } catch (err) {
      alert(`Synchronization failed: ${err}`)
    }
  }

  const handleDeleteAll = async () => {
    if (confirm('[WARNING]: This will purge ALL static data from localStorage!\n\nThis cannot be undone. Are you absolutely sure?')) {
      if (confirm('Final warning: Local categories, budgets, and payment methods will be reset to database configurations.')) {
        try {
          localStorage.removeItem('fintracker_static_data')
          alert('Local settings cache cleared. Restoring configurations from database...')
          await manager.refresh()
          onDataChange?.()
        } catch (err) {
          alert(`Failed to restore data: ${err}`)
        }
      }
    }
  }

  const toggleItemStatus = (type: StaticDataType, id: string, currentStatus: boolean) => {
    manager.update(type, id, { isActive: !currentStatus })
    onDataChange?.()
  }

  const filteredItems = useMemo(() => {
    if (activeSection === 'navigation' || activeSection === 'travelSettings') return []
    return ((data as any)[activeSection] || []).filter((item: any) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [data, activeSection, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Slide-over panel */}
      <div 
        className="relative w-full max-w-2xl bg-slate-50 shadow-2xl h-full flex flex-col animate-slide-left sm:rounded-l-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings</h2>
            <p className="text-xs text-slate-500 mt-1">Manage app preferences and data.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Mobile Accordion Header */}
          <div className="md:hidden bg-slate-50 border-b border-slate-200 p-3 z-10 sticky top-0">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  if (activeSection === 'navigation') return <><LayoutTemplate className="h-5 w-5 text-indigo-600"/> Bottom Nav</>;
                  if (activeSection === 'travelSettings') return <><Car className="h-5 w-5 text-indigo-600"/> Travel Config</>;
                  const meta = sectionMeta[activeSection as StaticDataType];
                  const Icon = meta?.icon || Settings;
                  return <><Icon className="h-5 w-5 text-indigo-600"/> {meta?.label || 'Settings'}</>;
                })()}
              </div>
              {isMobileMenuOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div className={`w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto shrink-0 transition-all duration-300 md:max-h-full ${isMobileMenuOpen ? 'max-h-[50vh]' : 'max-h-0 md:max-h-full border-none md:border-solid md:border-r'}`}>
            <div className="flex flex-col p-3 md:p-4 gap-1.5 md:gap-2">
              {Object.entries(sectionMeta).map(([key, meta], index) => {
                const colors = ['text-rose-500', 'text-emerald-500', 'text-blue-500', 'text-amber-500', 'text-purple-500', 'text-cyan-500']
                const iconColor = colors[index % colors.length]
                const Icon = meta.icon
                const isSelected = activeSection === key
                return (
                  <button
                    key={key}
                    onClick={() => handleSectionChange(key as StaticDataType)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isSelected ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : iconColor}`} />
                    <span className="truncate">{meta.label}</span>
                  </button>
                )
              })}
              <button
                onClick={() => handleSectionChange('navigation')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeSection === 'navigation' ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <LayoutTemplate className={`h-4 w-4 ${activeSection === 'navigation' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="truncate">Bottom Nav</span>
              </button>
              <button
                onClick={() => handleSectionChange('travelSettings')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeSection === 'travelSettings' ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Car className={`h-4 w-4 ${activeSection === 'travelSettings' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="truncate">Travel Config</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              {(isDataLoading || isNavLoading) ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm animate-pulse">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                  <p className="mt-3 text-sm font-medium text-slate-500">Loading configurations...</p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {activeSection === 'navigation' ? (
                    <NavSettingsDnd slots={slots} updateSlots={updateSlots} isAdmin={isAdmin} />
                  ) : activeSection === 'travelSettings' ? (
                    <TravelSettingsPanel data={data} manager={manager} />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">{sectionMeta[activeSection as StaticDataType].label}</h2>
                          <p className="text-xs text-slate-500 mt-1">{sectionMeta[activeSection as StaticDataType].description}</p>
                        </div>
                        <button
                          onClick={() => {
                            const defaultItem = activeSection === 'budgetAmounts' 
                              ? { type: activeSection, id: null, name: '', isActive: true, amount: 0, period: 'monthly' as const, category: '' }
                              : { type: activeSection, id: null, name: '', isActive: true }
                            setEditingItem(defaultItem)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" /> Add
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search items..."
                          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        {filteredItems.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900">{item.name}</span>
                              {activeSection === 'budgetAmounts' && (
                                <span className="text-[10px] text-slate-500">₹{item.amount} / {item.period} ({item.category})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => toggleItemStatus(activeSection as StaticDataType, item.id, item.isActive)} className="p-1.5 text-slate-400 hover:text-indigo-600">
                                {item.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button onClick={() => setEditingItem({ ...item, type: activeSection as StaticDataType })} className="p-1.5 text-slate-400 hover:text-blue-600">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(activeSection as StaticDataType, item.id)} className="p-1.5 text-slate-400 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-md border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                {editingItem.id ? 'Edit' : 'Add New'} {editingItem.type as string === 'navigation' || editingItem.type as string === 'travelSettings' ? '' : sectionMeta[editingItem.type]?.label.slice(0, -1)}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-900 font-semibold"
                  placeholder={`Enter ${sectionMeta[editingItem.type].label.slice(0, -1).toLowerCase()} name`}
                  autoFocus
                />
              </div>
              
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingItem.isActive}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none">
                  Enable / Active Option
                </label>
              </div>

              {/* Budget Amount Specific Fields */}
              {editingItem.type === 'budgetAmounts' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Link to Category
                    </label>
                    <select
                      value={editingItem.category || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-900 font-semibold cursor-pointer"
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
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={editingItem.amount || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-900 font-semibold"
                      placeholder="Enter budget threshold amount"
                      min="0"
                      step="100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Budget Period
                    </label>
                    <select
                      value={editingItem.period || 'monthly'}
                      onChange={(e) => setEditingItem({ ...editingItem, period: e.target.value as 'monthly' | 'yearly' })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-950 font-semibold cursor-pointer"
                    >
                      <option value="monthly">Monthly Budget</option>
                      <option value="yearly">Yearly Budget</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Import JSON Configurations
              </h3>
              <button
                type="button"
                onClick={() => { setShowImport(false); setImportData(''); }}
                className="p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Import Payload Data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-48 px-3.5 py-3 border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded-xl outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-slate-900 font-mono text-xs sm:text-sm leading-relaxed"
                  placeholder="Paste payload JSON exported from another fintracker device..."
                />
              </div>
              
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-amber-700 leading-normal font-medium">
                  <strong>Warning:</strong> Importing configuration payloads replaces current categories, options, and budgets completely. Stash current configurations via Export if needed.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => { setShowImport(false); setImportData(''); }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm shadow-purple-600/10 cursor-pointer"
              >
                Upload & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

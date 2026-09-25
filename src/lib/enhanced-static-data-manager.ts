/**
 * Enhanced Static Data Manager with Database + localStorage Sync
 * Handles CRUD operations with database persistence and localStorage caching
 */

import { useState, useEffect, useCallback } from 'react'

export interface StaticDataItem {
  id: string
  name: string
  isActive: boolean
  isSystem?: boolean
  createdAt: string
  updatedAt: string
}

export interface BudgetItem extends StaticDataItem {
  amount: number
  period: 'monthly' | 'yearly'
  category: string
}

export interface StaticDataCollection {
  expenseCategories: StaticDataItem[]
  incomeCategories: StaticDataItem[]
  paymentMethods: StaticDataItem[]
  incomeSources: StaticDataItem[]
  expensePurposes: StaticDataItem[]
  budgetAmounts: BudgetItem[]
  userSettings: Record<string, string>
}

export type StaticDataType = keyof Omit<StaticDataCollection, 'userSettings'>
export type DataItem<T extends StaticDataType> = T extends 'budgetAmounts' ? BudgetItem : StaticDataItem

const STORAGE_KEY = 'fintracker_static_data'
const STORAGE_VERSION = '2.0'

// Default static data (fallback for first-time setup)
const DEFAULT_DATA: StaticDataCollection = {
  expenseCategories: [
    'Food & Dining', 'Groceries', 'Transportation', 'Shopping',
    'Bills & Utilities', 'Entertainment', 'Healthcare', 'Other'
  ].map((name, index) => ({
    id: `exp_${index + 1}`,
    name,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  incomeCategories: [
    'Salary', 'Freelance', 'Business Income', 'Other'
  ].map((name, index) => ({
    id: `inc_${index + 1}`,
    name,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  paymentMethods: [
    'UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'
  ].map((name, index) => ({
    id: `pay_${index + 1}`,
    name,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  incomeSources: [
    'Primary Job', 'Freelance', 'Business', 'Other'
  ].map((name, index) => ({
    id: `src_${index + 1}`,
    name,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  expensePurposes: [
    'Personal', 'Family', 'Business', 'Other'
  ].map((name, index) => ({
    id: `pur_${index + 1}`,
    name,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  budgetAmounts: [],
  userSettings: {}
}

class EnhancedStaticDataManager {
  private data: StaticDataCollection = DEFAULT_DATA
  private listeners = new Set<() => void>()
  private isInitialized = false
  private initPromise: Promise<StaticDataCollection> | null = null

  // Initialize by fetching from database first, then localStorage as fallback
  async initialize(): Promise<StaticDataCollection> {
    if (this.isInitialized) {
      return this.data
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      try {
        // Try to fetch from database first

        const response = await fetch('/api/static-data', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          const dbData = await response.json()

          this.data = dbData
          this.saveToStorage(this.data)
          this.isInitialized = true
          this.notifyListeners()
          return this.data
        } else {
          throw new Error('Database fetch failed')
        }
      } catch (error) {
        console.warn('⚠️ Database fetch failed, trying localStorage...', error)
        
        // Fallback to localStorage
        try {
          const stored = this.loadFromStorage()
          if (stored) {

            this.data = stored
            this.isInitialized = true
            return this.data
          }
        } catch (storageError) {
          console.warn('⚠️ localStorage load failed:', storageError)
        }

        // Final fallback to default data and seed database

        this.data = DEFAULT_DATA
        await this.seedDatabase()
        this.saveToStorage(this.data)
        this.isInitialized = true
        return this.data
      } finally {
        this.initPromise = null
      }
    })();

    return this.initPromise;
  }

  // Seed database with default data
  private async seedDatabase(): Promise<void> {
    try {

      
      // Seed categories
      for (const [type, items] of Object.entries(DEFAULT_DATA)) {
        if (type === 'budgetAmounts') continue // Skip budget amounts for now
        
        for (const item of items as StaticDataItem[]) {
          try {
            await fetch('/api/static-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type,
                name: item.name
              })
            })
          } catch (error) {
            console.warn(`Failed to seed ${type} item:`, item.name, error)
          }
        }
      }
      

    } catch (error) {
      console.error('[ERROR] Database seeding failed:', error)
    }
  }

  // Load from localStorage (Disabled for security)
  private loadFromStorage(): StaticDataCollection | null {
    return null
  }

  // Save to localStorage (Disabled for security)
  private saveToStorage(data: StaticDataCollection): void {
    // No-op: Data is now only persisted to DB and kept in memory
  }

  // Notify all listeners of data changes
  private notifyListeners(): void {

    this.listeners.forEach(listener => listener())
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Get current data
  getData(): StaticDataCollection {
    return this.data
  }

  getDataByType(type: StaticDataType): StaticDataItem[] | BudgetItem[] {
    return this.data[type] || []
  }

  getActiveDataByType(type: StaticDataType): StaticDataItem[] | BudgetItem[] {
    const items = this.data[type] || []
    return items.filter(item => item.isActive)
  }

  // CRUD operations with database sync
  async create(type: Exclude<StaticDataType, 'budgetAmounts'>, name: string): Promise<StaticDataItem> {
    try {
      // Create in database
      const response = await fetch('/api/static-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Database create failed')
      }

      const newItem = await response.json()
      
      // Update local data
      this.data = {
        ...this.data,
        [type]: [...(this.data[type] || []), newItem]
      }
      
      // Save to localStorage and notify
      this.saveToStorage(this.data)
      this.notifyListeners()
      
      return newItem
    } catch (error) {
      console.error('Failed to create static data:', error)
      throw error
    }
  }

  async update(type: StaticDataType, id: string, updates: Partial<StaticDataItem>): Promise<StaticDataItem | null> {
    try {
      // Find current item in memory so we have full context (including name) even if caller only passes isActive
      const items = (this.data[type] || []) as StaticDataItem[]
      const existingLocal = items.find(item => item.id === id)

      const payload = {
        id,
        type,
        ...(existingLocal?.name && { name: existingLocal.name }),
        ...updates
      }

      // Update in database
      const response = await fetch('/api/static-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || errorData.message || `Database update failed (${response.status})`
        console.warn(`[EnhancedStaticDataManager] Server update failed: ${errorMsg}. Applying local optimistic update.`)

        if (existingLocal) {
          const updatedLocal = { ...existingLocal, ...updates, updatedAt: new Date().toISOString() }
          const index = items.findIndex(item => item.id === id)
          if (index !== -1) {
            const newItems = [...items]
            newItems[index] = updatedLocal
            this.data = { ...this.data, [type]: newItems }
            this.saveToStorage(this.data)
            this.notifyListeners()
          }
          return updatedLocal
        }

        throw new Error(errorMsg)
      }

      const updatedItem = await response.json()
      
      // Update local data, matching either by id or by name (in case a fallback id was resolved to a cuid)
      const index = items.findIndex(item => item.id === id || (item.name && item.name === updatedItem.name))
      if (index !== -1) {
        const newItems = [...items]
        newItems[index] = updatedItem
        this.data = { ...this.data, [type]: newItems }
      } else {
        this.data = { ...this.data, [type]: [...items, updatedItem] }
      }
      
      // Save to localStorage and notify
      this.saveToStorage(this.data)
      this.notifyListeners()
      
      return updatedItem
    } catch (error) {
      console.error('Failed to update static data:', error)
      throw error
    }
  }

  async delete(type: StaticDataType, id: string): Promise<boolean> {
    try {
      const items = (this.data[type] || []) as StaticDataItem[]
      const existingLocal = items.find(item => item.id === id)
      const nameParam = existingLocal?.name ? `&name=${encodeURIComponent(existingLocal.name)}` : ''

      // Delete from database
      const response = await fetch(`/api/static-data?id=${id}&type=${type}${nameParam}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('[EnhancedStaticDataManager] Server delete failed:', errorData.error || response.statusText)
      }
      
      // Update local data
      if (!this.data[type]) return false
      
      this.data = {
        ...this.data,
        [type]: items.filter(item => item.id !== id && (existingLocal?.name ? item.name !== existingLocal.name : true))
      }
      
      // Save to localStorage and notify
      this.saveToStorage(this.data)
      this.notifyListeners()
      
      return true
    } catch (error) {
      console.error('Failed to delete static data:', error)
      throw error
    }
  }

  // Budget amount specific methods
  async createBudgetAmount(name: string, amount: number, period: 'monthly' | 'yearly', category: string): Promise<BudgetItem> {
    try {
      // Create in database
      const response = await fetch('/api/static-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'budgetAmounts', name, amount, period, category })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Database create failed')
      }

      const newItem = await response.json()
      
      // Update local data
      this.data = {
        ...this.data,
        budgetAmounts: [...(this.data.budgetAmounts || []), newItem]
      }
      
      // Save to localStorage and notify
      this.saveToStorage(this.data)
      this.notifyListeners()
      
      return newItem
    } catch (error) {
      console.error('Failed to create budget amount:', error)
      throw error
    }
  }

  async updateBudgetAmount(id: string, updates: Partial<BudgetItem>): Promise<BudgetItem | null> {
    try {
      const currentAmounts = this.data.budgetAmounts || []
      const existingLocal = currentAmounts.find(item => item.id === id)

      const payload = {
        id,
        type: 'budgetAmounts',
        ...(existingLocal?.name && { name: existingLocal.name }),
        ...(existingLocal?.category && { category: existingLocal.category }),
        ...(existingLocal?.period && { period: existingLocal.period }),
        ...(existingLocal?.amount !== undefined && { amount: existingLocal.amount }),
        ...updates
      }

      // Update in database
      const response = await fetch('/api/static-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || errorData.message || `Database update failed (${response.status})`
        console.warn(`[EnhancedStaticDataManager] Server budget update failed: ${errorMsg}. Applying local optimistic update.`)

        if (existingLocal) {
          const updatedLocal: BudgetItem = {
            ...existingLocal,
            ...updates,
            updatedAt: new Date().toISOString()
          }
          const index = currentAmounts.findIndex(item => item.id === id)
          if (index !== -1) {
            const newAmounts = [...currentAmounts]
            newAmounts[index] = updatedLocal
            this.data = { ...this.data, budgetAmounts: newAmounts }
            this.saveToStorage(this.data)
            this.notifyListeners()
          }
          return updatedLocal
        }

        throw new Error(errorMsg)
      }

      const updatedItem = await response.json()
      
      // Update local data
      const index = this.data.budgetAmounts.findIndex(item => item.id === id || (item.name === updatedItem.name && item.category === updatedItem.category))
      if (index !== -1) {
        const newAmounts = [...this.data.budgetAmounts]
        newAmounts[index] = updatedItem
        this.data = { ...this.data, budgetAmounts: newAmounts }
      } else {
        this.data = { ...this.data, budgetAmounts: [...this.data.budgetAmounts, updatedItem] }
      }
      
      // Save to localStorage and notify
      this.saveToStorage(this.data)
      this.notifyListeners()
      
      return updatedItem
    } catch (error) {
      console.error('Failed to update budget amount:', error)
      throw error
    }
  }

  async deleteBudgetAmount(id: string): Promise<boolean> {
    try {
      const existingLocal = (this.data.budgetAmounts || []).find(item => item.id === id)
      const nameParam = existingLocal?.name ? `&name=${encodeURIComponent(existingLocal.name)}` : ''

      // Delete from database
      const response = await fetch(`/api/static-data?id=${id}&type=budgetAmounts${nameParam}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('[EnhancedStaticDataManager] Server budget delete failed:', errorData.error || response.statusText)
      }
      
      // Update local data
      this.data = {
        ...this.data,
        budgetAmounts: (this.data.budgetAmounts || []).filter(item => item.id !== id && (existingLocal?.name ? item.name !== existingLocal.name : true))
      }
      
      this.data = {
        ...this.data,
        budgetAmounts: this.data.budgetAmounts.filter(item => item.id !== id)
      }
      
      // Save to localStorage and notify
      this.saveToStorage(this.data)
      this.notifyListeners()
      
      return true
    } catch (error) {
      console.error('Failed to delete budget amount:', error)
      throw error
    }
  }

  // Utility methods
  getBudgetAmounts(): BudgetItem[] {
    return this.data.budgetAmounts || []
  }

  getExpenseCategories(): StaticDataItem[] {
    return this.data.expenseCategories.filter(item => item.isActive)
  }

  getIncomeCategories(): StaticDataItem[] {
    return this.data.incomeCategories.filter(item => item.isActive)
  }

  getPaymentMethods(): StaticDataItem[] {
    return this.data.paymentMethods.filter(item => item.isActive)
  }

  getIncomeSources(): StaticDataItem[] {
    return this.data.incomeSources.filter(item => item.isActive)
  }

  getExpensePurposes(): StaticDataItem[] {
    return this.data.expensePurposes.filter(item => item.isActive)
  }

  // User Settings Methods
  getSetting(key: string): string | undefined {
    return this.data.userSettings[key]
  }

  async saveSetting(key: string, value: string): Promise<void> {
    try {
      // Optimistic update - create a new data reference for React to detect change
      this.data = {
        ...this.data,
        userSettings: {
          ...this.data.userSettings,
          [key]: value
        }
      }
      this.saveToStorage(this.data)
      this.notifyListeners()

      // API request
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      if (!response.ok) throw new Error('Failed to save setting to DB')
    } catch (error) {
      console.error('Error saving user setting:', error)
      throw error
    }
  }

  // Force refresh from database
  async refresh(): Promise<void> {
    this.isInitialized = false
    await this.initialize()
  }

  // Export data
  export(): string {
    return JSON.stringify(this.data, null, 2)
  }

  // Import data (currently localStorage only, database sync would be implemented separately)
  import(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData)
      if (this.validateData(imported)) {
        this.data = imported
        this.saveToStorage(this.data)
        this.notifyListeners()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Reset to defaults (database sync would be implemented separately)
  reset(): void {
    this.data = DEFAULT_DATA
    this.saveToStorage(this.data)
    this.notifyListeners()
  }

  private validateData(data: unknown): data is StaticDataCollection {
    if (!data || typeof data !== 'object') return false
    const requiredKeys = ['expenseCategories', 'incomeCategories', 'paymentMethods', 'incomeSources', 'expensePurposes', 'budgetAmounts']
    return requiredKeys.every(key => key in data)
  }
}

// Create singleton instance
export const enhancedStaticDataManager = new EnhancedStaticDataManager()

// React hook for using enhanced static data
export function useEnhancedStaticData() {
  const [data, setData] = useState(() => enhancedStaticDataManager.getData())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await enhancedStaticDataManager.initialize()
        if (mounted) {
          setData(enhancedStaticDataManager.getData())
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load static data')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeData()

    // Subscribe to changes
    const unsubscribe = enhancedStaticDataManager.subscribe(() => {
      if (mounted) {
        setData(enhancedStaticDataManager.getData())
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    manager: enhancedStaticDataManager,
    refresh: () => enhancedStaticDataManager.refresh()
  }
}

// Backward compatibility exports
export const staticDataManager = enhancedStaticDataManager

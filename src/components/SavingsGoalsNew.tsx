'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Target, ArrowUpDown, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { SavingsGoal, GoalContribution, SavingsGoalsProps } from './goals/types'
import GoalKPIStrip from './goals/GoalKPIStrip'
import GoalCard from './goals/GoalCard'
import GoalActivityDrawer from './goals/GoalActivityDrawer'
import { AddGoalModal } from './goals/AddGoalModal'
import DeleteGoalModal from './goals/DeleteGoalModal'

export default function SavingsGoalsNew({ goals: initialGoals, onRefresh }: SavingsGoalsProps) {
  const { data: staticData } = useEnhancedStaticData()
  const [completedGoals, setCompletedGoals] = useState<SavingsGoal[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'target' | 'name'>('deadline')

  // Drawer & Modal State
  const [drawerGoal, setDrawerGoal] = useState<SavingsGoal | null>(null)
  const [drawerTab, setDrawerTab] = useState<'deposit' | 'history'>('history')
  const [showAddModal, setShowAddModal] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null)
  const [contributions, setContributions] = useState<Record<string, GoalContribution[]>>({})
  const [loadingContributions, setLoadingContributions] = useState(false)

  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    category: 'General'
  })

  // Fetch Achieved Goals
  const loadCompletedGoals = useCallback(async () => {
    try {
      const response = await fetch('/api/goals/completed')
      if (response.ok) setCompletedGoals(await response.json())
    } catch (error) {
      console.error('Failed to load completed goals:', error)
    }
  }, [])

  useEffect(() => {
    loadCompletedGoals()
  }, [loadCompletedGoals])

  // Fetch Contributions when opening drawer
  const fetchContributions = useCallback(async (goalId: string) => {
    setLoadingContributions(true)
    try {
      const response = await fetch(`/api/contributions?goalId=${goalId}`)
      if (response.ok) {
        const data = await response.json()
        setContributions(prev => ({ ...prev, [goalId]: data }))
      }
    } finally {
      setLoadingContributions(false)
    }
  }, [])

  const handleOpenDrawer = (goal: SavingsGoal, tab: 'deposit' | 'history' = 'history') => {
    setDrawerGoal(goal)
    setDrawerTab(tab)
    fetchContributions(goal.id)
  }

  // Combined unique goals pool
  const allGoalsPool = useMemo(() => {
    const map = new Map<string, SavingsGoal>()
    initialGoals.forEach(g => map.set(g.id, g))
    completedGoals.forEach(g => map.set(g.id, g))
    return Array.from(map.values())
  }, [initialGoals, completedGoals])

  // Available categories derived dynamically from user static data & goals
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    if (staticData?.expenseCategories) {
      staticData.expenseCategories.filter(c => c.isActive).forEach(c => cats.add(c.name))
    }
    if (staticData?.incomeCategories) {
      staticData.incomeCategories.filter(c => c.isActive).forEach(c => cats.add(c.name))
    }
    allGoalsPool.forEach(g => {
      if (g.category) cats.add(g.category)
    })
    return Array.from(cats).sort()
  }, [staticData, allGoalsPool])

  const activeFilterCategories = useMemo(() => {
    const cats = new Set<string>()
    allGoalsPool.forEach(g => { if (g.category) cats.add(g.category) })
    return Array.from(cats).sort()
  }, [allGoalsPool])

  // Processed Goals based on Tab, Category & Sort
  const inProgressGoals = useMemo(() => allGoalsPool.filter(g => Number(g.currentAmount) < Number(g.targetAmount)), [allGoalsPool])
  const achievedGoals = useMemo(() => allGoalsPool.filter(g => Number(g.currentAmount) >= Number(g.targetAmount) || g.isCompleted), [allGoalsPool])

  const processedGoals = useMemo(() => {
    let pool: SavingsGoal[] = []
    if (activeTab === 'in_progress') {
      pool = inProgressGoals
    } else if (activeTab === 'completed') {
      pool = achievedGoals
    } else {
      pool = allGoalsPool
    }

    if (selectedCategory !== 'all') {
      pool = pool.filter(g => (g.category || 'General').toLowerCase() === selectedCategory.toLowerCase())
    }

    return pool.sort((a, b) => {
      if (sortBy === 'deadline') {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : 9999999999999
        const timeB = b.deadline ? new Date(b.deadline).getTime() : 9999999999999
        return timeA - timeB
      }
      if (sortBy === 'progress') {
        const progA = (Number(a.currentAmount) || 0) / (Number(a.targetAmount) || 1)
        const progB = (Number(b.currentAmount) || 0) / (Number(b.targetAmount) || 1)
        return progB - progA
      }
      if (sortBy === 'target') return Number(b.targetAmount) - Number(a.targetAmount)
      return a.name.localeCompare(b.name)
    })
  }, [allGoalsPool, inProgressGoals, achievedGoals, activeTab, selectedCategory, sortBy])

  // Handlers
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      })
      if (response.ok) {
        toast.success('Savings goal created!')
        setShowAddModal(false)
        setNewGoal({ name: '', targetAmount: '', deadline: '', category: availableCategories[0] || 'General' })
        if (onRefresh) onRefresh()
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to create goal')
      }
    } catch {
      toast.error('Network error creating goal')
    }
  }

  const handleAddContribution = async (goalId: string, amount: number, paymentMethod: string, description: string, date: string) => {
    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, amount, paymentMethod, description, date })
      })
      if (res.ok) {
        toast.success(`Logged contribution of ₹${amount.toLocaleString('en-IN')}`)
        if (onRefresh) onRefresh()
        loadCompletedGoals()
        fetchContributions(goalId)
      }
    } catch {
      toast.error('Failed to log contribution')
    }
  }

  const handleDeleteContribution = async (id: string, goalId: string) => {
    try {
      const res = await fetch(`/api/contributions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Contribution removed')
        if (onRefresh) onRefresh()
        loadCompletedGoals()
        fetchContributions(goalId)
      }
    } catch {
      toast.error('Failed to delete contribution')
    }
  }

  const handleConfirmDeleteGoal = async (goal: SavingsGoal, deleteTransactions: boolean) => {
    try {
      const res = await fetch(`/api/goals?id=${goal.id}&deleteTransactions=${deleteTransactions}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(deleteTransactions ? 'Goal and linked transactions deleted' : 'Goal removed (transactions preserved)')
        setGoalToDelete(null)
        setDrawerGoal(null)
        if (onRefresh) onRefresh()
        loadCompletedGoals()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete goal')
      }
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  return (
    <div className="space-y-3.5 sm:space-y-4 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6 overflow-x-hidden">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Track your milestones and monthly commitment automatically.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-slate-100 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* 2. Executive Summary Strip */}
      <GoalKPIStrip goals={allGoalsPool} completedGoals={achievedGoals} />

      {/* 3. Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-2xl p-2 sm:px-3 shadow-sm">
        <div className="flex items-center bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-0.5 rounded-xl shrink-0">
          {[
            { id: 'all', label: 'All Goals', count: allGoalsPool.length },
            { id: 'in_progress', label: 'In Progress', count: inProgressGoals.length },
            { id: 'completed', label: 'Completed', count: achievedGoals.length }
          ].map(tab => (
            <button
              key={`tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-neutral-700 font-mono">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                  : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              All
            </button>
            {activeFilterCategories.map(cat => (
              <button
                key={`cat-${cat}`}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 capitalize ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                    : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-600 dark:text-neutral-300 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="appearance-none [-webkit-appearance:none] bg-transparent font-bold outline-none cursor-pointer text-xs pr-5 pl-0.5 border-0 focus:ring-0 text-slate-800 dark:text-neutral-200"
            >
              <option value="deadline" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Target Date</option>
              <option value="progress" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Progress %</option>
              <option value="target" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Target (High)</option>
              <option value="name" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Name</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. Goal Cards Grid */}
      {processedGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {processedGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              contributionsCount={contributions[goal.id]?.length ?? 0}
              onOpenDrawer={handleOpenDrawer}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-8 text-center shadow-sm">
          <div className="h-9 w-9 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-2 text-slate-500 dark:text-neutral-400">
            <Target className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No savings goals found</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 max-w-sm mx-auto">
            {activeTab === 'completed' ? 'No completed goals yet. Keep saving!' : 'Create your first goal to start tracking progress.'}
          </p>
        </div>
      )}

      {/* 5. Slide-Over Goal Activity & Deposit Drawer */}
      <GoalActivityDrawer
        goal={drawerGoal}
        isOpen={Boolean(drawerGoal)}
        onClose={() => setDrawerGoal(null)}
        initialTab={drawerTab}
        contributions={drawerGoal ? contributions[drawerGoal.id] || [] : []}
        loadingContributions={loadingContributions}
        onAddContribution={handleAddContribution}
        onDeleteContribution={handleDeleteContribution}
        onDeleteGoal={g => setGoalToDelete(g)}
      />

      {/* 6. Add Goal Modal */}
      <AddGoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        newGoal={newGoal}
        setNewGoal={setNewGoal}
        handleAddGoal={handleAddGoal}
        availableCategories={availableCategories}
      />

      {/* 7. Delete Goal Confirmation Modal with Full Transparency */}
      <DeleteGoalModal
        goal={goalToDelete}
        isOpen={Boolean(goalToDelete)}
        onClose={() => setGoalToDelete(null)}
        onConfirmDelete={handleConfirmDeleteGoal}
        contributionsCount={goalToDelete ? contributions[goalToDelete.id]?.length ?? 0 : 0}
      />
    </div>
  )
}

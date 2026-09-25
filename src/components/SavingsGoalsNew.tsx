'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Target, ArrowUpDown, ChevronDown, Layers, LayoutList, Route, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { SavingsGoal, GoalContribution, SavingsGoalsProps } from './goals/types'
import GoalKPIStrip from './goals/GoalKPIStrip'
import GoalHorizonStageView from './goals/GoalHorizonStageView'
import GoalMatrixView from './goals/GoalMatrixView'
import GoalMilestoneTimeline from './goals/GoalMilestoneTimeline'
import GoalActivityDrawer from './goals/GoalActivityDrawer'
import { AddGoalModal } from './goals/AddGoalModal'
import DeleteGoalModal from './goals/DeleteGoalModal'
import { SkeletonGoals } from './ui/SkeletonCard'

export default function SavingsGoalsNew({ goals: initialGoals, onRefresh }: SavingsGoalsProps) {
  const { data: staticData } = useEnhancedStaticData()
  const [completedGoals, setCompletedGoals] = useState<SavingsGoal[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'target' | 'name'>('deadline')
  const [viewMode, setViewMode] = useState<'horizon' | 'matrix' | 'timeline'>('horizon')

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
    category: ''
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

  // Available categories derived exclusively from the user's actual goals
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    allGoalsPool.forEach(g => {
      if (g.category?.trim()) cats.add(g.category.trim())
    })
    return Array.from(cats).sort()
  }, [allGoalsPool])

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
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.category.trim()) {
      toast.error('Please enter a goal name, target amount, and category')
      return
    }
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGoal,
          category: newGoal.category.trim()
        })
      })
      if (response.ok) {
        toast.success('Savings milestone created!')
        setShowAddModal(false)
        setNewGoal({ name: '', targetAmount: '', deadline: '', category: '' })
        if (onRefresh) onRefresh()
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to create goal')
      }
    } catch {
      toast.error('Network error creating goal')
    }
  }

  const handleAddContribution = async (
    goalId: string, 
    amount: number, 
    paymentMethod: string, 
    description: string, 
    date: string,
    action: 'deposit' | 'withdrawal' = 'deposit',
    reason?: string
  ) => {
    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, amount, paymentMethod, description, date, action, reason })
      })
      if (res.ok) {
        toast.success(action === 'withdrawal' 
          ? `Recorded withdrawal of ₹${amount.toLocaleString('en-IN')}` 
          : `Logged contribution of ₹${amount.toLocaleString('en-IN')}`)
        if (onRefresh) onRefresh()
        loadCompletedGoals()
        fetchContributions(goalId)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to record activity')
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

  if (!initialGoals) {
    return <SkeletonGoals />
  }

  return (
    <div className="space-y-4 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Savings Horizons & Milestones</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Strategic capital allocation, time horizons, and monthly pacing requirements.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Milestone</span>
        </button>
      </div>

      {/* 2. Portfolio Runway Telemetry Strip */}
      <GoalKPIStrip goals={allGoalsPool} completedGoals={achievedGoals} />

      {/* 3. Workflow Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-2 sm:px-3 shadow-sm">
        {/* Status Filter */}
        <div className="flex items-center bg-slate-100 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.06] p-0.5 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Horizons', count: allGoalsPool.length },
            { id: 'in_progress', label: 'Active', count: inProgressGoals.length },
            { id: 'completed', label: 'Conquered', count: achievedGoals.length }
          ].map(tab => (
            <button
              key={`tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                activeTab === tab.id ? 'bg-slate-200 dark:bg-black/10 text-slate-900 dark:text-black font-bold' : 'bg-slate-200/60 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Right Controls: Category filter, Sort, and Segmented View Modes */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Categories */}
          {activeFilterCategories.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                All
              </button>
              {activeFilterCategories.map(cat => (
                <button
                  key={`cat-${cat}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 capitalize cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Sort Menu */}
          <div className="relative flex items-center gap-1.5 bg-slate-100 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-300 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="appearance-none [-webkit-appearance:none] bg-transparent font-semibold outline-none cursor-pointer text-xs pr-5 pl-0.5 border-0 focus:ring-0 text-slate-800 dark:text-zinc-200"
            >
              <option value="deadline" className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-white">Target Date</option>
              <option value="progress" className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-white">Progress %</option>
              <option value="target" className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-white">Target Amount</option>
              <option value="name" className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-white">Name</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-400 pointer-events-none" />
          </div>

          {/* View Switcher: Horizons vs Matrix Ledger vs Timeline */}
          <div className="flex items-center bg-slate-100 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] p-0.5 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('horizon')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'horizon'
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Milestone Horizon Stages"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Horizons</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Ledger Matrix"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Chronological Agenda"
            >
              <Route className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Goal Experience (No Generic Cards!) */}
      {processedGoals.length > 0 ? (
        viewMode === 'horizon' ? (
          <GoalHorizonStageView
            goals={processedGoals}
            onOpenDrawer={handleOpenDrawer}
          />
        ) : viewMode === 'matrix' ? (
          <GoalMatrixView
            goals={processedGoals}
            onOpenDrawer={handleOpenDrawer}
          />
        ) : (
          <GoalMilestoneTimeline
            goals={processedGoals}
            onOpenDrawer={handleOpenDrawer}
          />
        )
      ) : (
        <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-10 text-center shadow-xs">
          <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center mx-auto mb-2.5 text-slate-400 dark:text-zinc-400">
            <Target className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No milestones found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'completed' ? 'No achieved milestones in this view.' : 'Create your first goal to establish your savings horizon and required pace.'}
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

      {/* 7. Delete Goal Confirmation Modal */}
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

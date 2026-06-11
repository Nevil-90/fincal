'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'

import { SavingsGoal, GoalContribution, BulkEntry, SavingsGoalsProps } from './goals/types'
import { AddGoalModal } from './goals/AddGoalModal'
import { MobileGoalsView } from './goals/MobileGoalsView'
import { DesktopGoalsView } from './goals/DesktopGoalsView'

export default function SavingsGoalsNew({ goals, availableBalance, onRefresh }: SavingsGoalsProps) {
  const { data: staticData } = useEnhancedStaticData()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedCompletedGoal, setSelectedCompletedGoal] = useState<string | null>(null)

  const [detailTab, setDetailTab] = useState<'quick' | 'history'>('quick')
  const [completedGoals, setCompletedGoals] = useState<SavingsGoal[]>([])
  const [loadingCompleted, setLoadingCompleted] = useState(false)
  const [contributions, setContributions] = useState<Record<string, GoalContribution[]>>({})
  const [loadingContributions, setLoadingContributions] = useState<string | null>(null)

  const [goalFilter, setGoalFilter] = useState<'overview' | 'active' | 'achieved' | 'bulk_add'>('overview')
  
  // Desktop layout controls
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [desktopSort, setDesktopSort] = useState<'priority' | 'deadline' | 'progress' | 'name'>('priority')

  // Bulk Add feature state
  const [bulkEntries, setBulkEntries] = useState<BulkEntry[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)

  const initializeBulkEntries = useCallback(() => {
    const activePaymentMethod = staticData.paymentMethods.find(m => m.isActive)?.name || ''
    
    const initial: BulkEntry[] = goals.filter(g => !g.isCompleted).map(g => ({
      id: crypto.randomUUID(),
      goalId: g.id,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: activePaymentMethod,
      description: ''
    }))
    setBulkEntries(initial)
  }, [goals, staticData])

  useEffect(() => {
    if (goalFilter === 'bulk_add') {
      initializeBulkEntries()
    }
  }, [goalFilter, initializeBulkEntries])

  const handleBulkEntryChange = (entryId: string, field: keyof BulkEntry, value: string) => {
    setBulkEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ))
  }

  const handleAddBulkRow = (goalId: string) => {
    const activePaymentMethod = staticData.paymentMethods.find(m => m.isActive)?.name || ''
    setBulkEntries(prev => {
      // Find the last entry for this goalId to insert the new one after it
      const lastIndex = [...prev].reverse().findIndex(e => e.goalId === goalId)
      const actualIndex = lastIndex >= 0 ? prev.length - 1 - lastIndex : prev.length - 1
      
      const newEntry: BulkEntry = {
        id: crypto.randomUUID(),
        goalId,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: activePaymentMethod,
        description: ''
      }
      
      const newEntries = [...prev]
      newEntries.splice(actualIndex + 1, 0, newEntry)
      return newEntries
    })
  }

  const handleRemoveBulkRow = (entryId: string) => {
    setBulkEntries(prev => prev.filter(e => e.id !== entryId))
  }

  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: ''
  })

  const [quickContribution, setQuickContribution] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: staticData.paymentMethods.find(m => m.isActive)?.name || '',
    description: ''
  })

  useEffect(() => {
    if (!quickContribution.paymentMethod) {
      const activeMethod = staticData.paymentMethods.find(m => m.isActive)
      if (activeMethod) {
        setQuickContribution(prev => ({ ...prev, paymentMethod: activeMethod.name }))
      }
    }
  }, [staticData])

  const currentGoal = goals.find(g => g.id === selectedGoal)
  const monthlySavingPotential = Math.max(0, availableBalance * 0.2)
  const monthlySavingRequired = currentGoal?.deadline 
    ? (() => {
      const remainingAmount = Math.max(0, currentGoal.targetAmount - currentGoal.currentAmount)
      const today = new Date()
      const deadline = new Date(currentGoal.deadline)
      const monthsRemaining = Math.max(
        1,
        (deadline.getFullYear() - today.getFullYear()) * 12 +
        (deadline.getMonth() - today.getMonth())
      )
      return remainingAmount / monthsRemaining
    })() 
    : 0

  // Aggregate Metrics for Dashboard Header
  const totalActiveTarget = goals.filter(g => !g.isCompleted).reduce((sum, g) => sum + g.targetAmount, 0)
  const totalActiveSaved = goals.filter(g => !g.isCompleted).reduce((sum, g) => sum + g.currentAmount, 0)
  const overallProgress = totalActiveTarget > 0 ? (totalActiveSaved / totalActiveTarget) * 100 : 0
  
  const totalMonthlySavingRequired = goals.filter(g => !g.isCompleted).reduce((sum, goal) => {
    if (!goal.deadline) return sum
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)
    const today = new Date()
    const deadlineDate = new Date(goal.deadline)
    const monthsRemaining = Math.max(
      1,
      (deadlineDate.getFullYear() - today.getFullYear()) * 12 +
      (deadlineDate.getMonth() - today.getMonth())
    )
    return sum + (remainingAmount / monthsRemaining)
  }, 0)

  const nextMilestoneGoal = goals.filter(g => !g.isCompleted && g.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

  const totalCompletedSaved = completedGoals.reduce((sum, g) => sum + g.targetAmount, 0)

  const getSortedGoals = (goalsList: SavingsGoal[]) => {
    return [...goalsList].sort((a, b) => {
      switch (desktopSort) {
        case 'priority': return b.priority - a.priority
        case 'deadline': return new Date(a.deadline || '9999').getTime() - new Date(b.deadline || '9999').getTime()
        case 'progress': {
          const progressA = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 0
          const progressB = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 0
          return progressB - progressA
        }
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })
  }

  const handleSaveBulkAllocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkSaving(true)
    try {
      const promises = bulkEntries
        .filter(entry => {
          const amt = parseFloat(entry.amount)
          return !isNaN(amt) && amt > 0
        })
        .map(entry => fetch('/api/contributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalId: entry.goalId,
            amount: parseFloat(entry.amount),
            date: entry.date,
            paymentMethod: entry.paymentMethod,
            description: entry.description
          })
        }))
      
      await Promise.all(promises)
      if (onRefresh) onRefresh()
      initializeBulkEntries() // reset inputs
    } catch (error) {
      console.error('Failed to save bulk contributions:', error)
    } finally {
      setBulkSaving(false)
    }
  }

  const loadCompletedGoals = async () => {
    setLoadingCompleted(true)
    try {
      const response = await fetch('/api/goals/completed')
      if (response.ok) {
        const completed = await response.json()
        setCompletedGoals(completed)
      }
    } catch (error) {
      console.error('Failed to load completed goals:', error)
    } finally {
      setLoadingCompleted(false)
    }
  }

  useEffect(() => {
    loadCompletedGoals()
  }, [])

  const fetchContributions = useCallback(async (goalId: string, forceRefresh = false) => {
    if (contributions[goalId] && !forceRefresh) return
    
    setLoadingContributions(goalId)
    try {
      const response = await fetch(`/api/contributions?goalId=${goalId}`)
      if (response.ok) {
        const data = await response.json()
        setContributions(prev => ({ ...prev, [goalId]: data }))
      }
    } catch (error) {
      console.error('Error fetching contributions:', error)
    } finally {
      setLoadingContributions(null)
    }
  }, [contributions])

  useEffect(() => {
    if (selectedGoal && detailTab === 'history') {
      fetchContributions(selectedGoal)
    }
  }, [selectedGoal, detailTab, fetchContributions])

  useEffect(() => {
    if (selectedCompletedGoal) {
      fetchContributions(selectedCompletedGoal)
    }
  }, [selectedCompletedGoal, fetchContributions])

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      })
      if (response.ok) {
        setShowAddForm(false)
        setNewGoal({ name: '', targetAmount: '', deadline: '' })
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error('Failed to create goal:', error)
    }
  }

  const handleQuickAddContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGoal) return

    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoal,
          amount: parseFloat(quickContribution.amount),
          date: quickContribution.date,
          paymentMethod: quickContribution.paymentMethod,
          description: quickContribution.description
        })
      })

      if (response.ok) {
        setQuickContribution({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: quickContribution.paymentMethod,
          description: ''
        })
        
        const addedAmount = parseFloat(quickContribution.amount)
        const willComplete = currentGoal && (currentGoal.currentAmount + addedAmount >= currentGoal.targetAmount)

        if (onRefresh) onRefresh()
        await fetchContributions(selectedGoal, true)
        setDetailTab('history')
        
        if (willComplete) {
          const completedId = selectedGoal
          setSelectedGoal(null)
          setGoalFilter('achieved')
          setSelectedCompletedGoal(completedId)
        }
      }
    } catch (error) {
      console.error('Failed to add contribution:', error)
    }
  }

  const handleDeleteContribution = async (contributionId: string, goalId: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return
    
    try {
      const response = await fetch(`/api/contributions?contributionId=${contributionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchContributions(goalId, true)
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error('Failed to delete contribution:', error)
    }
  }

  const handleDeleteGoal = async (goal: SavingsGoal) => {
    if (goal.currentAmount > 0) {
      if (!confirm(`Are you sure you want to delete "${goal.name}"? You have already allocated ${goal.currentAmount} to it.`)) {
        return
      }
    }
    
    try {
      const response = await fetch(`/api/goals?id=${goal.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        if (selectedGoal === goal.id) setSelectedGoal(null)
        if (selectedCompletedGoal === goal.id) setSelectedCompletedGoal(null)
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const calculatePace = (goal: SavingsGoal) => {
    if (!goal.deadline) return 0
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)
    const today = new Date()
    const deadline = new Date(goal.deadline)
    const monthsRemaining = Math.max(
      1,
      (deadline.getFullYear() - today.getFullYear()) * 12 +
      (deadline.getMonth() - today.getMonth())
    )
    return remainingAmount / monthsRemaining
  }

  const filteredGoals = goals.filter(g => !g.isCompleted)

  return (
    <>
      <MobileGoalsView
        goalFilter={goalFilter === 'overview' ? 'active' : goalFilter}
        setGoalFilter={(f) => setGoalFilter((f === 'pending' ? 'active' : f === 'completed' ? 'achieved' : f) as any)}
        setShowAddForm={setShowAddForm}
        filteredGoals={filteredGoals}
        completedGoals={completedGoals}
        selectedGoal={selectedGoal}
        setSelectedGoal={setSelectedGoal}
        selectedCompletedGoal={selectedCompletedGoal}
        setSelectedCompletedGoal={setSelectedCompletedGoal}
        monthlySavingRequired={monthlySavingRequired}
        monthlySavingPotential={monthlySavingPotential}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        quickContribution={quickContribution}
        setQuickContribution={setQuickContribution}
        handleQuickAddContribution={handleQuickAddContribution}
        handleDeleteContribution={handleDeleteContribution}
        handleDeleteGoal={handleDeleteGoal}
        contributions={contributions}
        loadingContributions={loadingContributions}
      />

      <DesktopGoalsView
        goalFilter={goalFilter}
        setGoalFilter={setGoalFilter}
        setShowAddForm={setShowAddForm}
        filteredGoals={filteredGoals}
        completedGoals={completedGoals}
        goals={goals}
        selectedGoal={selectedGoal}
        setSelectedGoal={setSelectedGoal}
        selectedCompletedGoal={selectedCompletedGoal}
        setSelectedCompletedGoal={setSelectedCompletedGoal}
        viewMode={viewMode}
        setViewMode={setViewMode}
        desktopSort={desktopSort}
        setDesktopSort={setDesktopSort}
        getSortedGoals={getSortedGoals}
        overallProgress={overallProgress}
        totalActiveSaved={totalActiveSaved}
        totalActiveTarget={totalActiveTarget}
        totalMonthlySavingRequired={totalMonthlySavingRequired}
        monthlySavingPotential={monthlySavingPotential}
        nextMilestoneGoal={nextMilestoneGoal}
        totalCompletedSaved={totalCompletedSaved}
        calculatePace={calculatePace}
        contributions={contributions}
        loadingContributions={loadingContributions}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        quickContribution={quickContribution}
        setQuickContribution={setQuickContribution}
        handleQuickAddContribution={handleQuickAddContribution}
        handleDeleteContribution={handleDeleteContribution}
        handleDeleteGoal={handleDeleteGoal}
        availableBalance={availableBalance}
        bulkEntries={bulkEntries}
        handleBulkEntryChange={handleBulkEntryChange}
        handleSaveBulkAllocation={handleSaveBulkAllocation}
        handleAddBulkRow={handleAddBulkRow}
        handleRemoveBulkRow={handleRemoveBulkRow}
        bulkSaving={bulkSaving}
      />

      <AddGoalModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        newGoal={newGoal}
        setNewGoal={setNewGoal}
        handleAddGoal={handleAddGoal}
      />
    </>
  )
}

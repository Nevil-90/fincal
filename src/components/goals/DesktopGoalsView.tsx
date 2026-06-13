'use client'

import { Target, Trophy, Plus, Trash2, History, TrendingUp, Calendar, Zap, Save, Loader2, Check, AlertTriangle, X, ChevronRight, Lightbulb } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { SavingsGoal, GoalContribution, BulkEntry } from './types'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { useState } from 'react'

interface QuickContribution {
  amount: string; date: string; paymentMethod: string; description: string
}

interface DesktopGoalsViewProps {
  goalFilter: 'overview' | 'active' | 'achieved' | 'bulk_add'
  setGoalFilter: (f: 'overview' | 'active' | 'achieved' | 'bulk_add') => void
  setShowAddForm: (s: boolean) => void
  filteredGoals: SavingsGoal[]
  completedGoals: SavingsGoal[]
  goals: SavingsGoal[]
  selectedGoal: string | null
  setSelectedGoal: (id: string | null) => void
  selectedCompletedGoal: string | null
  setSelectedCompletedGoal: (id: string | null) => void
  viewMode: 'cards' | 'list'
  setViewMode: (m: 'cards' | 'list') => void
  desktopSort: 'priority' | 'deadline' | 'progress' | 'name'
  setDesktopSort: (s: 'priority' | 'deadline' | 'progress' | 'name') => void
  getSortedGoals: (list: SavingsGoal[]) => SavingsGoal[]
  overallProgress: number
  totalActiveSaved: number
  totalActiveTarget: number
  totalMonthlySavingRequired: number
  monthlySavingPotential: number
  nextMilestoneGoal?: SavingsGoal
  totalCompletedSaved: number
  calculatePace: (goal: SavingsGoal) => number
  contributions: Record<string, GoalContribution[]>
  loadingContributions: string | null
  detailTab: 'quick' | 'history'
  setDetailTab: (t: 'quick' | 'history') => void
  quickContribution: QuickContribution
  setQuickContribution: React.Dispatch<React.SetStateAction<QuickContribution>>
  handleQuickAddContribution: (e: React.FormEvent) => void
  handleDeleteContribution: (id: string, goalId: string) => void
  handleDeleteGoal: (goal: SavingsGoal) => void
  availableBalance: number
  bulkEntries: BulkEntry[]
  handleBulkEntryChange: (id: string, field: keyof BulkEntry, value: string) => void
  handleSaveBulkAllocation: (e: React.FormEvent) => void
  handleAddBulkRow: (goalId: string) => void
  handleRemoveBulkRow: (id: string) => void
  bulkSaving: boolean
}

/* ─── SVG Circular Ring ─── */
function Ring({ pct, size = 80, stroke = 8, color = '#7c3aed', bg = '#ede9fe', label }: {
  pct: number; size?: number; stroke?: number; color?: string; bg?: string; label?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  const fontSize = size >= 80 ? 13 : size >= 60 ? 10 : 8
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      {label && (
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={fontSize} fontWeight={900} fill={color}
        >{label}</text>
      )}
    </svg>
  )
}

export function DesktopGoalsView(p: DesktopGoalsViewProps) {
  const { data: staticData } = useEnhancedStaticData()
  const [activeSection, setActiveSection] = useState<'active' | 'achieved' | 'bulk'>('active')

  const bulkTotal = p.bulkEntries.reduce((s, e) => {
    const n = parseFloat(e.amount); return s + (isNaN(n) ? 0 : n)
  }, 0)

  const activeGoal = p.filteredGoals.find(g => g.id === p.selectedGoal)
  const achievedGoal = p.completedGoals.find(g => g.id === p.selectedCompletedGoal)

  const ringColor = (pct: number) =>
    pct >= 75 ? '#059669' : pct >= 40 ? '#7c3aed' : '#d97706'
  const ringBg = (pct: number) =>
    pct >= 75 ? '#d1fae5' : pct >= 40 ? '#ede9fe' : '#fef3c7'

  return (
    <div className="hidden lg:flex flex-col h-[calc(100vh-130px)] overflow-hidden w-full gap-4">

      {/* ════════ HERO BANNER — matches app card style ════════ */}
      <div className="shrink-0 rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="flex items-center gap-0 px-6 py-4">

          {/* Ring */}
          <div className="shrink-0 mr-5">
            <Ring pct={p.overallProgress} size={80} stroke={7} color="#7c3aed" bg="#ede9fe" label={`${p.overallProgress.toFixed(0)}%`} />
          </div>

          {/* Title */}
          <div className="mr-8 shrink-0">
            <p className="text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Portfolio</p>
            <h1 className="text-slate-900 dark:text-white text-xl font-black leading-none">Savings Goals</h1>
            <p className="text-slate-400 dark:text-neutral-500 text-xs mt-1">{formatCurrency(p.totalActiveSaved)} of {formatCurrency(p.totalActiveTarget)}</p>
          </div>

          <div className="w-px h-12 bg-slate-100 dark:bg-neutral-800 mx-5 shrink-0" />

          {/* Monthly */}
          <div className="mr-8 shrink-0">
            <p className="text-slate-400 dark:text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Needed</p>
            <p className="text-slate-900 dark:text-white text-lg font-black">{formatCurrency(p.totalMonthlySavingRequired)}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {p.monthlySavingPotential >= p.totalMonthlySavingRequired
                ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">On Track</span></>
                : <><AlertTriangle className="w-3 h-3 text-amber-500" /><span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">Behind Pace</span></>
              }
            </div>
          </div>

          <div className="w-px h-12 bg-slate-100 dark:bg-neutral-800 mx-5 shrink-0" />

          {/* Active goals */}
          <div className="mr-8 shrink-0">
            <p className="text-slate-400 dark:text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Goals</p>
            <p className="text-slate-900 dark:text-white text-2xl font-black leading-none">{p.filteredGoals.length}</p>
            <p className="text-slate-400 dark:text-neutral-500 text-[10px] mt-0.5">in progress</p>
          </div>

          <div className="w-px h-12 bg-slate-100 dark:bg-neutral-800 mx-5 shrink-0" />

          {/* Achieved */}
          <div className="shrink-0">
            <p className="text-slate-400 dark:text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Achieved</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-slate-900 dark:text-white text-2xl font-black leading-none">{p.completedGoals.length}</p>
              <Trophy className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
            </div>
            <p className="text-slate-400 dark:text-neutral-500 text-[10px] mt-0.5">{formatCurrency(p.totalCompletedSaved)} saved</p>
          </div>

          {/* New Goal button */}
          <div className="ml-auto shrink-0">
            <button
              onClick={() => p.setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Goal
            </button>
          </div>
        </div>
      </div>

      {/* ════════ BODY ════════ */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-64 shrink-0 flex flex-col rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">

          {/* Section pills */}
          <div className="p-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-neutral-800">
              {[
                { key: 'active', label: 'Active', count: p.filteredGoals.length },
                { key: 'achieved', label: 'Done', count: p.completedGoals.length },
                { key: 'bulk', label: 'Bulk' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => {
                    setActiveSection(s.key as any)
                    if (s.key === 'active') { p.setGoalFilter('active'); p.setSelectedCompletedGoal(null) }
                    if (s.key === 'achieved') { p.setGoalFilter('achieved'); p.setSelectedGoal(null) }
                    if (s.key === 'bulk') { p.setGoalFilter('bulk_add'); p.setSelectedGoal(null); p.setSelectedCompletedGoal(null) }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeSection === s.key
                      ? 'bg-white dark:bg-neutral-900 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
                  }`}
                >
                  {s.label}
                  {s.count !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 rounded-full ${
                      activeSection === s.key
                        ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
                        : 'bg-slate-200 dark:bg-neutral-700 text-slate-400 dark:text-neutral-500'
                    }`}>{s.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">

            {activeSection === 'active' && (
              p.filteredGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                    <Target className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">No Active Goals</p>
                  <button onClick={() => p.setShowAddForm(true)} className="mt-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-violet-700 transition-colors">
                    + New Goal
                  </button>
                </div>
              ) : (
                <div className="py-1">
                  {p.getSortedGoals(p.filteredGoals).map(goal => {
                    const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                    const isSelected = p.selectedGoal === goal.id
                    return (
                      <button
                        key={goal.id}
                        onClick={() => { p.setSelectedGoal(goal.id); p.setGoalFilter('active') }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer border-l-2 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Ring pct={pct} size={38} stroke={4} color={ringColor(pct)} bg={ringBg(pct)} label={`${pct.toFixed(0)}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-neutral-200'}`}>{goal.name}</p>
                          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-violet-400' : 'text-slate-300 dark:text-neutral-600'}`} />
                      </button>
                    )
                  })}
                </div>
              )
            )}

            {activeSection === 'achieved' && (
              p.completedGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">No completed goals yet</p>
                </div>
              ) : (
                <div className="py-1">
                  {p.completedGoals.map(goal => {
                    const isSelected = p.selectedCompletedGoal === goal.id
                    return (
                      <button
                        key={goal.id}
                        onClick={() => { p.setSelectedCompletedGoal(goal.id); p.setGoalFilter('achieved') }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer border-l-2 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-neutral-200'}`}>{goal.name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">{formatCurrency(goal.targetAmount)} ✓</p>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-300 dark:text-neutral-600'}`} />
                      </button>
                    )
                  })}
                </div>
              )
            )}

            {activeSection === 'bulk' && (
              <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Bulk Add Mode</p>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Fill the form on the right →</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL ── */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">

          {/* Active: no selection */}
          {activeSection === 'active' && !p.selectedGoal && (
            <div className="h-full overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {/* Coach card */}
              <div className="rounded-2xl border border-violet-100 dark:border-violet-900/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Goal Coach</p>
                    <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                      {(() => {
                        const rg = p.goals.filter(g => !g.isCompleted).find(g => (g.targetAmount - g.currentAmount) <= p.availableBalance)
                        const hg = [...p.goals].filter(g => !g.isCompleted).sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0]
                        if (rg) return `🎯 You can complete "${rg.name}" right now! You have ${formatCurrency(p.availableBalance)} available — it only needs ${formatCurrency(rg.targetAmount - rg.currentAmount)} more.`
                        if (hg) return `💪 "${hg.name}" is at ${((hg.currentAmount / hg.targetAmount) * 100).toFixed(0)}%. You have ${formatCurrency(p.availableBalance)} available to push it further.`
                        return 'Create your first savings goal and we\'ll give you personalized tips to reach it faster.'
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals list */}
              {p.filteredGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-700">
                  <Target className="w-10 h-10 text-slate-300 dark:text-neutral-600 mb-3" />
                  <p className="text-slate-500 dark:text-neutral-400 font-semibold text-sm">No active goals yet</p>
                  <button onClick={() => p.setShowAddForm(true)} className="mt-4 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors">
                    + Create First Goal
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {p.getSortedGoals(p.filteredGoals).map(goal => {
                    const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
                    const rc = ringColor(pct)
                    const rb = ringBg(pct)
                    return (
                      <div
                        key={goal.id}
                        onClick={() => p.setSelectedGoal(goal.id)}
                        className="flex items-center gap-5 px-6 py-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                      >
                        <Ring pct={pct} size={64} stroke={6} color={rc} bg={rb} label={`${pct.toFixed(0)}%`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{goal.name}</h3>
                            {goal.deadline && (
                              <span className="text-xs text-slate-400 dark:text-neutral-500 flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3" />
                                {new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                            <span className="text-sm text-slate-400 dark:text-neutral-500">of {formatCurrency(goal.targetAmount)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-0.5">Remaining</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-neutral-300">{formatCurrency(remaining)}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); p.setSelectedGoal(goal.id) }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-violet-500/20 whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Funds
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active: goal selected */}
          {activeSection === 'active' && p.selectedGoal && activeGoal && (
            <ActiveGoalDetail
              goal={activeGoal}
              contributions={p.contributions}
              loadingContributions={p.loadingContributions}
              detailTab={p.detailTab}
              setDetailTab={p.setDetailTab}
              quickContribution={p.quickContribution}
              setQuickContribution={p.setQuickContribution}
              handleQuickAddContribution={p.handleQuickAddContribution}
              handleDeleteContribution={p.handleDeleteContribution}
              handleDeleteGoal={p.handleDeleteGoal}
              calculatePace={p.calculatePace}
              availableBalance={p.availableBalance}
              monthlySavingPotential={p.monthlySavingPotential}
              onClose={() => p.setSelectedGoal(null)}
              staticData={staticData}
              ringColor={ringColor}
              ringBg={ringBg}
            />
          )}

          {/* Achieved: nothing selected */}
          {activeSection === 'achieved' && !p.selectedCompletedGoal && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-neutral-200">
                {p.completedGoals.length} Goal{p.completedGoals.length !== 1 ? 's' : ''} Achieved
              </p>
              <p className="text-slate-400 dark:text-neutral-500 text-sm max-w-xs">
                {p.completedGoals.length === 0
                  ? 'Keep contributing to your active goals and celebrate when you hit 100%!'
                  : 'Select a goal from the left to view its contribution history.'}
              </p>
              {p.completedGoals.length > 0 && (
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.totalCompletedSaved)} total saved</p>
              )}
            </div>
          )}

          {/* Achieved: goal selected */}
          {activeSection === 'achieved' && p.selectedCompletedGoal && achievedGoal && (
            <AchievedGoalDetail
              goal={achievedGoal}
              contributions={p.contributions}
              loadingContributions={p.loadingContributions}
              handleDeleteGoal={p.handleDeleteGoal}
              handleDeleteContribution={p.handleDeleteContribution}
              onClose={() => p.setSelectedCompletedGoal(null)}
            />
          )}

          {/* Bulk add */}
          {activeSection === 'bulk' && (
            <BulkAddPanel
              goals={p.goals}
              bulkEntries={p.bulkEntries}
              handleBulkEntryChange={p.handleBulkEntryChange}
              handleSaveBulkAllocation={p.handleSaveBulkAllocation}
              handleAddBulkRow={p.handleAddBulkRow}
              handleRemoveBulkRow={p.handleRemoveBulkRow}
              bulkSaving={p.bulkSaving}
              bulkTotal={bulkTotal}
              staticData={staticData}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   ACTIVE GOAL DETAIL — no-scroll layout
═══════════════════════════════════ */
function ActiveGoalDetail({
  goal, contributions, loadingContributions, detailTab, setDetailTab,
  quickContribution, setQuickContribution, handleQuickAddContribution,
  handleDeleteContribution, handleDeleteGoal, calculatePace,
  availableBalance, monthlySavingPotential, onClose, staticData, ringColor, ringBg
}: any) {
  const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const pace = calculatePace(goal)
  const rc = ringColor(pct)
  const rb = ringBg(pct)

  return (
    /* IMPORTANT: This whole panel must fit without scrolling. */
    <div className="h-full flex flex-col rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">

      {/* ── Compact header ── */}
      <div className="shrink-0 flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950">
        <Ring pct={pct} size={56} stroke={5} color={rc} bg={rb} label={`${pct.toFixed(0)}%`} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-0.5">Active Goal</p>
          <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{goal.name}</h2>
          {goal.deadline && (
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-violet-400" />
              Due {new Date(goal.deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
        {/* 3 mini stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Saved</p>
            <p className="text-sm font-black text-violet-600 dark:text-violet-400">{formatCurrency(goal.currentAmount)}</p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-neutral-700" />
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Remaining</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(remaining)}</p>
          </div>
          {pace > 0 && (
            <>
              <div className="w-px h-8 bg-slate-200 dark:bg-neutral-700" />
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Monthly</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(pace)}</p>
              </div>
            </>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button onClick={() => handleDeleteGoal(goal)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-300 dark:text-neutral-600 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab strip ── */}
      <div className="shrink-0 flex border-b border-slate-100 dark:border-neutral-800">
        {[
          { key: 'quick', label: 'Add Contribution', icon: <Plus className="w-3.5 h-3.5" /> },
          { key: 'history', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setDetailTab(t.key)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              detailTab === t.key
                ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400 bg-violet-50/40 dark:bg-violet-900/10'
                : 'text-slate-500 dark:text-neutral-400 border-transparent hover:text-slate-700 dark:hover:text-neutral-300 hover:border-slate-200 dark:hover:border-neutral-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Content: FIXED HEIGHT, no flex scroll ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">

        {detailTab === 'quick' && (
          <form onSubmit={handleQuickAddContribution} className="p-5 flex flex-col gap-4">

            {/* Amount + chips in one compact block */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-1.5">Amount</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number" step="0.01" placeholder="Enter amount"
                    value={quickContribution.amount}
                    onChange={e => {
                      let v = e.target.value
                      const n = parseFloat(v)
                      if (!isNaN(n) && n > remaining) v = remaining.toString()
                      setQuickContribution((prev: any) => ({ ...prev, amount: v }))
                    }}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-all"
                    required
                  />
                </div>
                {/* Quick chips inline */}
                <div className="flex gap-1.5">
                  {[500, 1000, 5000, 10000].map(amt => (
                    <button key={amt} type="button"
                      onClick={() => setQuickContribution((prev: any) => ({ ...prev, amount: amt.toString() }))}
                      className={`px-2.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                        quickContribution.amount === amt.toString()
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                          : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 hover:border-violet-300'
                      }`}
                    >
                      +{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date + Method side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-1.5">Date</label>
                <div className="relative">
                  <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-xs font-medium flex items-center justify-between pointer-events-none">
                    <span>{quickContribution.date ? new Date(quickContribution.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pick date'}</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input type="date" value={quickContribution.date}
                    onChange={e => setQuickContribution((prev: any) => ({ ...prev, date: e.target.value }))}
                    onClick={(e: any) => { try { if ('showPicker' in HTMLInputElement.prototype) e.target.showPicker() } catch {} }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-1.5">Payment Method</label>
                <select
                  value={quickContribution.paymentMethod}
                  onChange={e => setQuickContribution((prev: any) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-sm font-medium text-slate-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer transition-all"
                >
                  {staticData.paymentMethods.filter((m: any) => m.isActive).map((m: any) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-1.5">Note (Optional)</label>
              <input type="text" placeholder="e.g. salary bonus, side income…"
                value={quickContribution.description}
                onChange={e => setQuickContribution((prev: any) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-sm text-slate-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>

            <button type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Add Contribution
            </button>

            {monthlySavingPotential > 0 && (
              <p className="text-xs text-slate-400 dark:text-neutral-500 text-center flex items-center justify-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                You can safely add up to {formatCurrency(monthlySavingPotential)} this month
              </p>
            )}
          </form>
        )}

        {detailTab === 'history' && (
          <div className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-violet-500" /> Contribution History
            </h3>
            {loadingContributions === goal.id ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-neutral-700" />
                    <div className="flex-1"><div className="h-3 bg-slate-200 dark:bg-neutral-700 rounded w-20 mb-1.5" /><div className="h-2.5 bg-slate-100 dark:bg-neutral-800 rounded w-28" /></div>
                  </div>
                ))}
              </div>
            ) : (contributions[goal.id]?.length > 0) ? (
              <div className="space-y-1">
                {contributions[goal.id].map((c: GoalContribution) => (
                  <div key={c.id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">+{formatCurrency(c.amount)}</p>
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 truncate">
                        {new Date(c.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {c.description ? ` · ${c.description}` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleDeleteContribution(c.id, goal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-2.5">
                  <History className="w-5 h-5 text-slate-300 dark:text-neutral-600" />
                </div>
                <p className="text-slate-500 dark:text-neutral-400 font-semibold text-sm">No contributions yet</p>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Switch to Add tab to make your first deposit.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   ACHIEVED GOAL DETAIL
═══════════════════════════════════ */
function AchievedGoalDetail({ goal, contributions, loadingContributions, handleDeleteGoal, handleDeleteContribution, onClose }: any) {
  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-wider mb-2.5">
              <Trophy className="w-3 h-3 text-amber-300" /> Goal Achieved
            </div>
            <h2 className="text-xl font-black text-white">{goal.name}</h2>
            <p className="text-emerald-100 text-xs mt-1">
              {formatCurrency(goal.targetAmount)} — completed {goal.completedAt
                ? new Date(goal.completedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
                : 'recently'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleDeleteGoal(goal)} className="p-2 rounded-xl bg-white/10 hover:bg-red-500/40 text-white transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-slate-50 dark:bg-neutral-950 custom-scrollbar">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-4 flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-emerald-500" /> Contribution Journey
        </h3>
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          {loadingContributions === goal.id ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="flex items-center gap-3"><div className="w-9 h-9 bg-slate-200 dark:bg-neutral-700 rounded-xl" /><div className="flex-1"><div className="h-3 bg-slate-200 dark:bg-neutral-700 rounded w-24 mb-1.5" /><div className="h-2.5 bg-slate-100 dark:bg-neutral-800 rounded w-16" /></div></div>)}
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-neutral-800">
              {(contributions[goal.id] || goal.contributions || []).length > 0 ? (
                (contributions[goal.id] || goal.contributions || []).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-xs font-black text-emerald-600 dark:text-emerald-400">✓</div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">+{formatCurrency(c.amount)}</p>
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 dark:text-neutral-500 text-sm">No contribution data stored.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   BULK ADD PANEL
═══════════════════════════════════ */
function BulkAddPanel({ goals, bulkEntries, handleBulkEntryChange, handleSaveBulkAllocation, handleAddBulkRow, handleRemoveBulkRow, bulkSaving, bulkTotal, staticData }: any) {
  return (
    <div className="h-full flex flex-col rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-neutral-800 shrink-0 bg-slate-50 dark:bg-neutral-950">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
          <Zap className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">Bulk Contributions</p>
          <p className="text-xs text-slate-400 dark:text-neutral-500">Add contributions to multiple goals at once</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5 custom-scrollbar">
        <table className="w-full border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b-2 border-slate-100 dark:border-neutral-800">
              {['Goal', 'Amount (₹)', 'Date', 'Payment Method', 'Notes', ''].map((h, i) => (
                <th key={h} className={`pb-3 pt-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 text-left ${i === 5 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/60">
            {bulkEntries.map((entry: BulkEntry) => {
              const goal = goals.find((g: SavingsGoal) => g.id === entry.goalId)
              if (!goal) return null
              const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              return (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors group">
                  <td className="py-3 px-2 w-[22%] align-middle">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[130px]">{goal.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-10 bg-slate-100 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden"><div className="bg-violet-500 h-full" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 w-[16%] align-middle">
                    <input type="number" step="0.01" placeholder="0.00" value={entry.amount}
                      onChange={e => handleBulkEntryChange(entry.id, 'amount', e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </td>
                  <td className="py-3 px-2 w-[15%] align-middle">
                    <input type="date" value={entry.date}
                      onChange={e => handleBulkEntryChange(entry.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </td>
                  <td className="py-3 px-2 w-[18%] align-middle">
                    <select value={entry.paymentMethod} onChange={e => handleBulkEntryChange(entry.id, 'paymentMethod', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer">
                      {staticData.paymentMethods.filter((m: any) => m.isActive).map((m: any) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-2 align-middle">
                    <input type="text" placeholder="Optional note" value={entry.description}
                      onChange={e => handleBulkEntryChange(entry.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </td>
                  <td className="py-3 px-2 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleAddBulkRow(goal.id)} className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-400 hover:text-violet-600 cursor-pointer transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleRemoveBulkRow(entry.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-600 dark:text-neutral-300">Total:</span>
          <span className="px-3.5 py-1.5 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold text-sm border border-violet-200 dark:border-violet-800">
            {formatCurrency(bulkTotal)}
          </span>
        </div>
        <button onClick={handleSaveBulkAllocation} disabled={bulkSaving || bulkTotal === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-violet-500/20 transition-all cursor-pointer active:scale-95">
          {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All
        </button>
      </div>
    </div>
  )
}

// Component for AddGoalModal.tsx
import { Target, X, Plus, Calendar } from 'lucide-react'
import { useEffect } from 'react'

interface NewGoal {
  name: string
  targetAmount: string
  deadline: string
  category: string
}

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  newGoal: NewGoal
  setNewGoal: (goal: NewGoal) => void
  handleAddGoal: (e: React.FormEvent) => void
  categories?: { id: string, name: string }[]
}

export function AddGoalModal({ isOpen, onClose, newGoal, setNewGoal, handleAddGoal, categories = [] }: AddGoalModalProps) {
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-neutral-950/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md relative z-10 animate-slide-up shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200/50 dark:border-neutral-800">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/25 rounded-xl">
              <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">New Savings Goal</h3>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Define your next financial milestone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-neutral-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleAddGoal} className="space-y-5">

            {/* Goal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest mb-2">
                What are you saving for?
              </label>
              <input
                type="text"
                placeholder="e.g. Dream Vacation, New Car, Emergency Fund…"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white outline-none text-sm placeholder:text-slate-400 dark:placeholder:text-neutral-600"
                required
              />
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest mb-2">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  placeholder="100000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white outline-none text-sm"
                  step="0.01"
                  required
                />
              </div>

              {/* Quick amount presets */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[10000, 50000, 100000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNewGoal({ ...newGoal, targetAmount: amt.toString() })}
                    className={`px-3 py-1 text-xs font-semibold border rounded-lg transition-all cursor-pointer ${
                      newGoal.targetAmount === amt.toString()
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400'
                        : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 hover:border-violet-300'
                    }`}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Category (if available) */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white outline-none text-sm cursor-pointer"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest mb-2">
                Target Date <span className="text-slate-300 dark:text-neutral-600 font-normal normal-case tracking-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white flex items-center justify-between pointer-events-none transition-colors text-sm">
                  <span className={newGoal.deadline ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-neutral-600'}>
                    {newGoal.deadline
                      ? new Date(newGoal.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Select target date'}
                  </span>
                  <Calendar className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                </div>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) (e.target as HTMLInputElement).showPicker()
                    } catch {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3.5 px-4 rounded-xl transition-all font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 flex justify-center items-center gap-2 cursor-pointer active:scale-[0.97]"
              >
                <Plus className="h-5 w-5" /> Create Goal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

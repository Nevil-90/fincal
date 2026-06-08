// Component for AddGoalModal.tsx
import { Target, X, Plus, Calendar } from 'lucide-react'
import { useEffect } from 'react'

interface NewGoal {
  name: string
  targetAmount: string
  deadline: string
}

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  newGoal: NewGoal
  setNewGoal: (goal: NewGoal) => void
  handleAddGoal: (e: React.FormEvent) => void
}

export function AddGoalModal({ isOpen, onClose, newGoal, setNewGoal, handleAddGoal }: AddGoalModalProps) {
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
      <div className="fixed inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md relative z-10 animate-slide-up shadow-2xl overflow-hidden max-h-[90vh] flex flex-col overscroll-contain">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <Target className="h-4 w-4" />
            </div>
            New Savings Goal
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleAddGoal} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">What are you saving for?</label>
              <input
                type="text"
                placeholder="e.g., Dream Vacation, New Car..."
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-gray-900 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Target Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 font-medium">₹</span>
                <input
                  type="number"
                  placeholder="100000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-gray-900 dark:text-white outline-none"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Target Date <span className="text-gray-400 dark:text-neutral-500 font-normal">(Optional)</span></label>
              <div className="relative w-full">
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-white flex items-center justify-between pointer-events-none transition-colors">
                  <span className={newGoal.deadline ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-neutral-500'}>
                    {newGoal.deadline
                      ? new Date(newGoal.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'yyyy-mm-dd'}
                  </span>
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-neutral-500" />
                </div>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        (e.target as HTMLInputElement).showPicker();
                      }
                    } catch (err) {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 px-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all font-semibold shadow-lg shadow-purple-500/25 flex justify-center items-center gap-2"
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

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, User, Lock, Save, Shield, Trash2, AlertTriangle } from 'lucide-react'

interface ProfileModalProps {
  onClose: () => void
  user: { firstName: string; lastName: string; email: string } | null
  onUserUpdate: () => void // Callback to refresh user data if needed
}

export default function ProfileModal({ onClose, user, onUserUpdate }: ProfileModalProps) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  })
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    // If user prop is updated, sync it
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      })
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
        onUserUpdate()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setSaving(false)
      return
    }
    
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await fetch('/api/auth/profile', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/login'
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete account' })
        setSaving(false)
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[500] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Slide-over panel */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#121215] border-l border-slate-200/80 dark:border-white/[0.08] shadow-2xl h-full flex flex-col animate-slide-left sm:rounded-l-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#16161a]/60 shrink-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">My Profile</h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-200/80 dark:border-white/[0.06] px-6 pt-2">
          <button
            onClick={() => { setActiveTab('profile'); setMessage({type:'', text:''}); }}
            className={`pb-3 px-1 mr-6 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'profile' ? 'border-blue-600 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Personal Info
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage({type:'', text:''}); }}
            className={`pb-3 px-1 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'password' ? 'border-blue-600 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Security
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {message.text && (
            <div className={`mb-5 p-3 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-xl text-slate-500 dark:text-zinc-500 cursor-not-allowed text-xs"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors text-xs"
                  />
                </div>
              </div>
              
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors text-xs"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors text-xs"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors text-xs"
                />
              </div>
              
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
            
            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/[0.06]">
              <h3 className="text-xs font-semibold text-rose-500 dark:text-rose-400 mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400" /> Danger Zone
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">
                Permanently delete your account and all associated data including transactions, goals, and recurring setups. This action cannot be undone.
              </p>
              
              {showDeleteConfirm ? (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-3">Are you absolutely sure?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      disabled={saving}
                    >
                      {saving ? 'Deleting...' : 'Yes, Delete Account'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl transition-all shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Account
                </button>
              )}
            </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

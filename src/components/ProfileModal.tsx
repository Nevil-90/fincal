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
        className="absolute inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Slide-over panel */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl h-full flex flex-col animate-slide-left sm:rounded-l-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Profile</h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-neutral-800 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('profile'); setMessage({type:'', text:''}); }}
            className={`pb-3 px-1 mr-6 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'profile' ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
          >
            Personal Info
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage({type:'', text:''}); }}
            className={`pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'password' ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
          >
            Security
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {message.text && (
            <div className={`mb-5 p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-500 cursor-not-allowed text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm"
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Lock className="h-4 w-4" />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
            
            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Danger Zone
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
                Permanently delete your account and all associated data including transactions, goals, and recurring setups. This action cannot be undone.
              </p>
              
              {showDeleteConfirm ? (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-3">Are you absolutely sure?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
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
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
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

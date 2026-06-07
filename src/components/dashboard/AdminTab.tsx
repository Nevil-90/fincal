'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  ShieldCheck,
  Database,
  Mail,
  AlertTriangle,
  Activity,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  UserMinus,
  UserPlus,
  Download,
  Server,
  Terminal,
  ShieldOff
} from 'lucide-react'

interface UserRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  reason: string
  isActive: boolean
  role: string
  createdAt: string
}

interface SessionRecord {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
}


export default function AdminTab() {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'sessions' | 'system'>('users')

  // Data states
  const [users, setUsers] = useState<UserRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  // Loading & Error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // SMTP Health-check Console state
  const [smtpLog, setSmtpLog] = useState<string[]>([])
  const [smtpChecking, setSmtpChecking] = useState(false)

  // Search query
  const [searchQuery, setSearchQuery] = useState('')

  // Confirm Toast state
  const [pendingDeleteUser, setPendingDeleteUser] = useState<{ id: string, name: string } | null>(null)

  // Pagination states
  const [usersPage, setUsersPage] = useState(1)
  const [sessionsPage, setSessionsPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Reset user pagination on search
  useEffect(() => {
    setUsersPage(1)
  }, [searchQuery])

  // Load Admin Data on tab selection
  useEffect(() => {
    fetchUsers()
    fetchSessions()
  }, [])

  // Fetch Users List
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Session Tracker Lines
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/sessions')
      const data = await res.json()
      if (res.ok) {
        setSessions(data.sessions || [])
      }
    } catch (err: any) {
      console.error(err)
    }
  }


  // Handle User Modifications (Suspend/Activate/Promote/Demote)
  const handleUserAction = async (targetUserId: string, action: 'ACTIVATE' | 'SUSPEND' | 'PROMOTE_ADMIN' | 'DEMOTE_USER') => {
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(data.message || 'Administrative action completed successfully')
        fetchUsers()
        fetchSessions() // reload sessions if a user was suspended
      } else {
        throw new Error(data.error || 'Action failed')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Revoke Session
  const handleRevokeSession = async (sessionId: string) => {
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/sessions?id=${sessionId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(data.message || 'Session revoked successfully')
        fetchSessions()
      } else {
        throw new Error(data.error || 'Failed to revoke session')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }


  const handleSMTPHealthCheck = async () => {
    setError(null)
    setSuccess(null)
    setSmtpChecking(true)
    setSmtpLog(['[INIT] Initiating diagnostic handshakes...', '[NET] Resolving host...'])

    try {
      const res = await fetch('/api/admin/health-check', {
        method: 'POST'
      })
      const data = await res.json()

      if (res.ok) {
        setSmtpLog(prev => [
          ...prev,
          '[SUCCESS] Connection established.',
          '[AUTH] Authenticating...',
          '[SUCCESS] Authentication successful.',
          '[MAIL] Dispatching diagnostic test email to administrator...',
          '[SUCCESS] Diagnostics successful!'
        ])
        setSuccess('SMTP diagnostics completed.')
      } else {
        throw new Error(data.error || 'Diagnostics failed')
      }
    } catch (err: any) {
      setSmtpLog(prev => [
        ...prev,
        '[FAIL] Connection verification failed.',
        `[ERROR] Error details: ${err.message}`
      ])
      setError(err.message)
    } finally {
      setSmtpChecking(false)
    }
  }

  // Format File Size
  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination logic
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)

  const paginatedSessions = sessions.slice((sessionsPage - 1) * ITEMS_PER_PAGE, sessionsPage * ITEMS_PER_PAGE)
  const totalSessionPages = Math.ceil(sessions.length / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Visual Header Banner */}
      <div className="rounded-[28px] border border-slate-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-neutral-400">Security Control</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400 shrink-0" />
            Administration
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Monitor system operations, manage user access, terminate stale sessions, and safeguard assets.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchUsers(); fetchSessions(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 dark:bg-neutral-900 text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Total Users</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{users.length}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Active Sessions</span>
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{sessions.length}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800/70 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">SMTP Server</span>
            <Mail className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-md font-bold text-slate-800 dark:text-neutral-200 mt-3.5 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
            Operational
          </p>
        </div>

      </div>

      {/* Success/Error Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 animate-slide-in">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-700 dark:text-emerald-400 animate-slide-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Sub Tabs Toggle Bar */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 gap-6">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeSubTab === 'users' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:text-neutral-200'
            }`}
        >
          User Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeSubTab === 'sessions' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:text-neutral-200'
            }`}
        >
          Session Controller ({sessions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('system')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeSubTab === 'system' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:text-neutral-200'
            }`}
        >
          SMTP & System Diagnostics
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}

      {/* Tab 1: User Directory */}
      {activeSubTab === 'users' && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800/70 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-3 w-full max-w-md border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-800 dark:text-neutral-200 placeholder-slate-400"
            />
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-neutral-900/50">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Registration Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Registered On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 dark:text-neutral-300">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/60 dark:bg-neutral-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400">{u.email}</div>
                    </td>
                    <td className="py-4 px-4 max-w-xs truncate" title={u.reason}>
                      {u.reason || 'None provided'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right space-x-1.5 shrink-0">
                      {u.isActive ? (
                        <button
                          onClick={() => handleUserAction(u.id, 'SUSPEND')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 dark:text-red-400 bg-red-50/30 dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/40 dark:bg-red-900/20 text-xs font-bold transition-all"
                          title="Suspend Access"
                        >
                          <UserMinus className="h-3.5 w-3.5" /> Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(u.id, 'ACTIVATE')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 dark:bg-emerald-900/20 text-xs font-bold transition-all"
                          title="Approve / Activate"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Activate
                        </button>
                      )}

                      {u.role === 'ADMIN' ? (
                        <button
                          onClick={() => handleUserAction(u.id, 'DEMOTE_USER')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 dark:bg-neutral-900 text-xs font-bold transition-all"
                          title="Revoke Admin Access"
                        >
                          Demote
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(u.id, 'PROMOTE_ADMIN')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/40 dark:bg-blue-900/20 text-xs font-bold transition-all"
                          title="Promote to Admin"
                        >
                          Make Admin
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setPendingDeleteUser({ id: u.id, name: `${u.firstName} ${u.lastName}` })
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400 bg-red-100/50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold transition-all"
                        title="Delete User completely"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                      No users match your active search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {paginatedUsers.map((u) => (
              <div key={u.id} className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400">{u.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${u.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Reason</span>
                  {u.reason || 'None provided'}
                </div>

                <div className="flex justify-between items-center text-xs px-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                      }`}>
                      {u.role}
                    </span>
                    <span className="text-slate-400 font-medium">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Compact Action Buttons */}
                  <div className="flex gap-1.5 items-center">
                    {u.isActive ? (
                      <button
                        onClick={() => handleUserAction(u.id, 'SUSPEND')}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100/50"
                        title="Suspend Access"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(u.id, 'ACTIVATE')}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-100/50"
                        title="Activate Access"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    )}
                    {u.role === 'ADMIN' ? (
                      <button
                        onClick={() => handleUserAction(u.id, 'DEMOTE_USER')}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors border border-slate-200/50"
                        title="Demote to User"
                      >
                        <ShieldOff className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(u.id, 'PROMOTE_ADMIN')}
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100/50"
                        title="Promote to Admin"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setPendingDeleteUser({ id: u.id, name: `${u.firstName} ${u.lastName}` })
                      }}
                      className="p-2 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-500/50"
                      title="Delete User completely"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="py-8 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
                No users match your active search query.
              </div>
            )}
          </div>

          {/* User Pagination */}
          {totalUserPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-neutral-800 pt-5 mt-2 px-1">
              <button
                disabled={usersPage === 1}
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-bold bg-slate-50 dark:bg-neutral-900 px-3 py-1 rounded-lg">Page {usersPage} of {totalUserPages}</span>
              <button
                disabled={usersPage === totalUserPages}
                onClick={() => setUsersPage(p => Math.min(totalUserPages, p + 1))}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sessions Controller */}
      {activeSubTab === 'sessions' && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800/70 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Login Sessions</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Review active browser sessions stored in the database. You can instantly revoke session keys to terminate access.
            </p>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-neutral-900/50">
                  <th className="py-3 px-4">Active User</th>
                  <th className="py-3 px-4">Token Session ID</th>
                  <th className="py-3 px-4">Expires At</th>
                  <th className="py-3 px-4">Created On</th>
                  <th className="py-3 px-4 text-right">Access Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 dark:text-neutral-300">
                {paginatedSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/60 dark:bg-neutral-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.user?.firstName} {s.user?.lastName}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400">{s.user?.email}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-500 dark:text-neutral-400">
                      {s.token.substring(0, 16)}...
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {new Date(s.expiresAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/40 dark:bg-red-900/20 text-xs font-bold transition-all"
                        title="Force Logout"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke Access
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                      No active database sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {paginatedSessions.map((s) => (
              <div key={s.id} className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{s.user?.firstName} {s.user?.lastName}</div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400">{s.user?.email}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="font-mono text-[10px] text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 hidden sm:block">
                      {s.token.substring(0, 12)}...
                    </div>
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100/50"
                      title="Revoke Access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border border-slate-100 mt-1">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5 text-[9px]">Created</span>
                    <span className="text-slate-700 dark:text-neutral-300 font-semibold">{new Date(s.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5 text-[9px]">Expires</span>
                    <span className="text-slate-700 dark:text-neutral-300 font-semibold">{new Date(s.expiresAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="py-8 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
                No active database sessions found.
              </div>
            )}
          </div>

          {/* Session Pagination */}
          {totalSessionPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-neutral-800 pt-5 mt-2 px-1">
              <button
                disabled={sessionsPage === 1}
                onClick={() => setSessionsPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-bold bg-slate-50 dark:bg-neutral-900 px-3 py-1 rounded-lg">Page {sessionsPage} of {totalSessionPages}</span>
              <button
                disabled={sessionsPage === totalSessionPages}
                onClick={() => setSessionsPage(p => Math.min(totalSessionPages, p + 1))}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: System Diagnostics & SMTP Check */}
      {activeSubTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Box 1: SMTP Health Diagnostics */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800/70 rounded-3xl shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-500" />
                SMTP Mail Diagnostics
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Run an active socket connection handshake against <code>smtp.gmail.com</code> and dispatch a system check notification.
              </p>
            </div>

            <button
              onClick={handleSMTPHealthCheck}
              disabled={smtpChecking}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {smtpChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Verifying Connection...
                </>
              ) : (
                <>
                  <Server className="h-4 w-4" /> Run Live SMTP Test
                </>
              )}
            </button>

            {/* Interactive Terminal */}
            <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-emerald-400 space-y-2 max-h-60 overflow-y-auto">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-bold border-b border-slate-800 pb-2 mb-2">
                <Terminal className="h-4 w-4" />
                <span>DIAGNOSTICS INTERACTION SHELL</span>
              </div>
              {smtpLog.map((log, index) => (
                <div key={index} className="leading-5 animate-fade-in">
                  <span className="text-slate-500 dark:text-neutral-400 mr-2">[{index + 1}]</span> {log}
                </div>
              ))}
              {smtpLog.length === 0 && (
                <div className="text-slate-600 dark:text-neutral-400 italic">No diagnostic checks have been executed yet. Click test to run.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {pendingDeleteUser && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
          <div className="bg-slate-900 dark:bg-neutral-800 text-white rounded-2xl shadow-2xl overflow-hidden w-[340px] border border-slate-700 dark:border-neutral-700">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Delete {pendingDeleteUser.name}?</h4>
                  <p className="text-xs text-slate-300 dark:text-neutral-400 mt-1">
                    This will permanently erase all of their transactions, goals, and system data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setPendingDeleteUser(null)}
                  className="flex-1 px-3 py-2 bg-slate-800 dark:bg-neutral-700 hover:bg-slate-700 dark:hover:bg-neutral-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUserAction(pendingDeleteUser.id, 'DELETE' as any)
                    setPendingDeleteUser(null)
                  }}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

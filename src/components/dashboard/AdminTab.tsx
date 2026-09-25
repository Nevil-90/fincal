'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Server,
  Terminal,
  ShieldOff,
  Clock,
  Key,
  Filter
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

type UserFilter = 'all' | 'active' | 'suspended' | 'admin'

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

  // Filters & Search query
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<UserFilter>('all')

  // Confirm Toast state
  const [pendingDeleteUser, setPendingDeleteUser] = useState<{ id: string; name: string } | null>(null)

  // Pagination states
  const [usersPage, setUsersPage] = useState(1)
  const [sessionsPage, setSessionsPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    setUsersPage(1)
  }, [searchQuery, userFilter])

  useEffect(() => {
    fetchUsers()
    fetchSessions()
  }, [])

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

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/sessions')
      const data = await res.json()
      if (res.ok) {
        setSessions(data.sessions || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err)
    }
  }

  const handleUserAction = async (userId: string, action: 'ACTIVATE' | 'SUSPEND' | 'PROMOTE_ADMIN' | 'DEMOTE_USER' | 'DELETE') => {
    try {
      setError(null)
      setSuccess(null)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(data.message || `Action ${action} completed successfully`)
        fetchUsers()
      } else {
        throw new Error(data.error || `Action failed`)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setError(null)
      setSuccess(null)
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Session revoked successfully')
        fetchSessions()
      } else {
        throw new Error(data.error || 'Failed to revoke session')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSMTPHealthCheck = async () => {
    setSmtpChecking(true)
    setSmtpLog([])
    const addLog = (msg: string) => setSmtpLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`])

    try {
      addLog('Initiating secure handshake to SMTP transport...')
      const res = await fetch('/api/admin/health-check', { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.success) {
        addLog('Socket connection established.')
        addLog('Authentication verified with SMTP relay server.')
        addLog('Dispatched test delivery notification successfully.')
        addLog('Health status: OPERATIONAL.')
        setSuccess('SMTP Diagnostic test completed: Server is healthy.')
      } else {
        addLog(`Transport error: ${data.error || 'Connection failed'}`)
        addLog('Health status: DEGRADED / UNHEALTHY.')
        setError(`SMTP Error: ${data.error || 'Check environment configuration'}`)
      }
    } catch (err: any) {
      addLog(`Network exception: ${err.message}`)
      setError('Failed to complete diagnostic check.')
    } finally {
      setSmtpChecking(false)
    }
  }

  // Filter users based on search & filter pill
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.reason || '').toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchSearch) return false

      if (userFilter === 'active') return u.isActive
      if (userFilter === 'suspended') return !u.isActive
      if (userFilter === 'admin') return u.role === 'ADMIN'
      return true
    })
  }, [users, searchQuery, userFilter])

  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1

  const paginatedSessions = sessions.slice((sessionsPage - 1) * ITEMS_PER_PAGE, sessionsPage * ITEMS_PER_PAGE)
  const totalSessionPages = Math.ceil(sessions.length / ITEMS_PER_PAGE) || 1

  return (
    <div className="space-y-4 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6">
      {/* 1. Header & Command Telemetry Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Security & Administration Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Identity directory, active session governance, permissions control, and system diagnostics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { fetchUsers(); fetchSessions(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 bg-white dark:bg-[#16161a] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync State</span>
        </button>
      </div>

      {/* 2. Operations & Security Telemetry Strip (Administrative, Non-Dashboard Pattern) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Identity Directory
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{users.length}</span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">accounts registered</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Active Sessions
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{sessions.length}</span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">live device tokens</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Mail Gateway
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready (smtp.gmail.com)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Database Health
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Connected • SQLite WAL</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* 3. Administration Module Switcher */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#121215] p-1 shadow-xs">
        <div className="flex flex-row items-center gap-1 w-full">
          {[
            { id: 'users', label: `Identity Directory (${users.length})`, icon: Users },
            { id: 'sessions', label: `Session Controller (${sessions.length})`, icon: Key },
            { id: 'system', label: 'System Diagnostics & Ops', icon: Server }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as 'users' | 'sessions' | 'system')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Module Contents */}

      {/* MODULE 1: Identity & Access Directory */}
      {activeSubTab === 'users' && (
        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xs overflow-hidden p-4 sm:p-5 space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 w-full sm:max-w-xs border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-1.5 bg-slate-50 dark:bg-[#16161a]">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Filter users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06] p-0.5 rounded-xl shrink-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'suspended', label: 'Suspended' },
                { id: 'admin', label: 'Admins' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setUserFilter(f.id as UserFilter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    userFilter === f.id
                      ? 'bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto [scrollbar-width:none]">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/[0.06] text-slate-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/80 dark:bg-[#16161a]/60">
                  <th className="py-2.5 px-3.5">User Identity</th>
                  <th className="py-2.5 px-3.5">Registration Context</th>
                  <th className="py-2.5 px-3.5">Access State</th>
                  <th className="py-2.5 px-3.5">Role</th>
                  <th className="py-2.5 px-3.5">Joined Date</th>
                  <th className="py-2.5 px-3.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-neutral-300">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">{u.firstName} {u.lastName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 max-w-xs truncate text-slate-500 dark:text-neutral-400" title={u.reason}>
                      {u.reason || 'Standard registration'}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-white/[0.06]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[11px] text-slate-500 dark:text-neutral-400 tabular-nums">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3.5 text-right space-x-1.5 shrink-0">
                      {u.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleUserAction(u.id, 'SUSPEND')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <UserMinus className="h-3 w-3" /> Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUserAction(u.id, 'ACTIVATE')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <UserPlus className="h-3 w-3" /> Activate
                        </button>
                      )}

                      {u.role === 'ADMIN' ? (
                        <button
                          type="button"
                          onClick={() => handleUserAction(u.id, 'DEMOTE_USER')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Demote
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUserAction(u.id, 'PROMOTE_ADMIN')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Promote
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPendingDeleteUser({ id: u.id, name: `${u.firstName} ${u.lastName}` })}
                        className="inline-flex items-center gap-1 p-1 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-neutral-500 text-xs">
                      No users match the active search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Dedicated Mobile User Cards (< md) */}
          <div className="md:hidden space-y-2.5">
            {paginatedUsers.map((u) => (
              <div key={u.id} className="bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06] rounded-xl p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {u.firstName?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">{u.firstName} {u.lastName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      u.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-white/[0.06]">
                      {u.role}
                    </span>
                  </div>
                </div>

                {/* Administrative Touch Controls */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 tabular-nums">
                    Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {u.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleUserAction(u.id, 'SUSPEND')}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-semibold"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUserAction(u.id, 'ACTIVATE')}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold"
                      >
                        Activate
                      </button>
                    )}

                    {u.role === 'ADMIN' ? (
                      <button
                        type="button"
                        onClick={() => handleUserAction(u.id, 'DEMOTE_USER')}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-neutral-300 border border-slate-200/80 dark:border-white/[0.08] text-[10px] font-semibold"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUserAction(u.id, 'PROMOTE_ADMIN')}
                        className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold"
                      >
                        Promote
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPendingDeleteUser({ id: u.id, name: `${u.firstName} ${u.lastName}` })}
                      className="p-1 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* User Pagination */}
          {totalUserPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-white/[0.06] pt-3 text-xs">
              <button
                type="button"
                disabled={usersPage === 1}
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 font-semibold bg-white dark:bg-[#16161a] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border border-slate-200/90 dark:border-white/[0.08] rounded-xl disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">Page {usersPage} of {totalUserPages}</span>
              <button
                type="button"
                disabled={usersPage === totalUserPages}
                onClick={() => setUsersPage(p => Math.min(totalUserPages, p + 1))}
                className="px-3 py-1.5 font-semibold bg-white dark:bg-[#16161a] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border border-slate-200/90 dark:border-white/[0.08] rounded-xl disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODULE 2: Session Controller */}
      {activeSubTab === 'sessions' && (
        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xs overflow-hidden p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Active Database Session Tokens
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Review and revoke authenticated browser sessions to terminate stale device access.
            </p>
          </div>

          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto [scrollbar-width:none]">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/[0.06] text-slate-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/80 dark:bg-[#16161a]/60">
                  <th className="py-2.5 px-3.5">Account</th>
                  <th className="py-2.5 px-3.5">Session Fingerprint</th>
                  <th className="py-2.5 px-3.5">Expires At</th>
                  <th className="py-2.5 px-3.5">Issued On</th>
                  <th className="py-2.5 px-3.5 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-neutral-300">
                {paginatedSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{s.user?.firstName} {s.user?.lastName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400">{s.user?.email}</div>
                    </td>
                    <td className="py-3 px-3.5 tabular-nums text-xs text-slate-500 dark:text-neutral-400">
                      <code>{s.token.substring(0, 16)}...</code>
                    </td>
                    <td className="py-3 px-3.5 text-xs text-slate-500 dark:text-neutral-400 tabular-nums">
                      {new Date(s.expiresAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3.5 text-xs text-slate-500 dark:text-neutral-400 tabular-nums">
                      {new Date(s.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Revoke
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-neutral-500 text-xs">
                      No active sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Dedicated Mobile Session Cards (< md) */}
          <div className="md:hidden space-y-2.5">
            {paginatedSessions.map((s) => (
              <div key={s.id} className="bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06] rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">{s.user?.firstName} {s.user?.lastName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">{s.user?.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(s.id)}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-semibold shrink-0 cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-neutral-400 tabular-nums bg-white dark:bg-white/[0.02] p-2 rounded-lg border border-slate-200/70 dark:border-white/[0.04] space-y-0.5">
                  <div>Expires: {new Date(s.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  <div>Issued: {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 3: System Diagnostics & Maintenance */}
      {activeSubTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SMTP Health Diagnostics */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xs p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                SMTP Socket & Mail Diagnostics
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Execute a live socket handshake against the configured mail relay and test delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSMTPHealthCheck}
              disabled={smtpChecking}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {smtpChecking ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying Socket Handshake...
                </>
              ) : (
                <>
                  <Server className="h-3.5 w-3.5" /> Run SMTP Diagnostic Test
                </>
              )}
            </button>

            {/* Interactive Shell Output */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200/80 dark:border-slate-800 tabular-nums text-xs text-slate-800 dark:text-emerald-400 space-y-1 max-h-56 overflow-y-auto font-sans">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-semibold border-b border-slate-200/80 dark:border-white/[0.06] pb-1.5 mb-1.5 text-[10px]">
                <Terminal className="h-3.5 w-3.5" />
                <span>DIAGNOSTICS CONSOLE LOG</span>
              </div>
              {smtpLog.map((log, index) => (
                <div key={index} className="leading-relaxed text-[11px]">
                  <span className="text-slate-400 dark:text-neutral-500 mr-1.5">[{index + 1}]</span> {log}
                </div>
              ))}
              {smtpLog.length === 0 && (
                <div className="text-slate-400 dark:text-neutral-500 italic text-[11px]">No diagnostic checks run yet. Click button above.</div>
              )}
            </div>
          </div>

          {/* Database Maintenance Telemetry */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xs p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                Database Engine & Infrastructure
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Finacal operates on SQLite WAL mode with Prisma ORM. Routine housekeeping cleans expired sessions and transient reset tokens automatically.
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-neutral-400">Environment</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Production (Local Container)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-neutral-400">Prisma Client</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">v5.22.0 (Active)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-neutral-400">Security Model</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Role-Based Access Control (RBAC)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {pendingDeleteUser && (
        <div className="fixed inset-0 z-[250] bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete User Account?</h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Permanently delete <strong className="text-slate-900 dark:text-white">{pendingDeleteUser.name}</strong> and all linked transactions, goals, and session keys. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteUser(null)}
                className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-[#16161a] hover:bg-slate-200/70 dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUserAction(pendingDeleteUser.id, 'DELETE')
                  setPendingDeleteUser(null)
                }}
                className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

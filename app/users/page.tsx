'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { UserPlus, Trash2, Copy, CheckCircle, Shield, Eye, EyeOff, Plug, X, Pencil, Save, ChevronDown, ChevronUp } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface User { id: number; username: string; email: string; role: string; isActive: boolean }

const TABS = [
  { key: 'dashboard',        label: 'Dashboard' },
  { key: 'marketOverview',   label: 'Market Overview' },
  { key: 'liveSignals',      label: 'Live Signals' },
  { key: 'positions',        label: 'Positions' },
  { key: 'tradeHistory',     label: 'Trade History' },
  { key: 'orders',           label: 'Orders' },
  { key: 'riskManagement',   label: 'Risk Management' },
  { key: 'fundsMargin',      label: 'Funds & Margin' },
  { key: 'brokerSetup',      label: 'Broker Setup' },
  { key: 'strategySetup',    label: 'Strategy Setup' },
  { key: 'strategySettings', label: 'Strategy Settings' },
  { key: 'configuration',    label: 'Configuration' },
  { key: 'logs',             label: 'Logs' },
  { key: 'reports',          label: 'Reports' },
  { key: 'userManagement',   label: 'User Management' },
]

const DEFAULT_USER_PERMS = {
  dashboard: true, marketOverview: false, liveSignals: true,
  positions: true, tradeHistory: true, orders: false,
  riskManagement: true, fundsMargin: false, brokerSetup: false,
  strategySetup: true, strategySettings: false, configuration: false, logs: false,
  reports: false, userManagement: false,
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER' })
  const [perms, setPerms] = useState({ ...DEFAULT_USER_PERMS })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedUser, setExpandedUser] = useState<number | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: getAuthHeaders() })
      if (res.ok) setUsers(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async () => {
    setError(''); setSaving(true)
    try {
      const userRes = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form)
      })
      if (!userRes.ok) { const d = await userRes.json(); throw new Error(d.error || 'Failed to create user') }
      const newUser = await userRes.json()
      await fetch(`${API}/api/permissions/${newUser.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(perms)
      })
      setShowAdd(false)
      setForm({ username: '', email: '', password: '', role: 'USER' })
      setPerms({ ...DEFAULT_USER_PERMS })
      fetchUsers()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this user? This will remove all their data.')) return
    await fetch(`${API}/api/auth/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
    fetchUsers()
  }

  const handleCopy = (id: number) => {
    const u = users.find(u => u.id === id)
    if (!u) return
    navigator.clipboard.writeText(`Email: ${u.email}`)
    setCopied(id); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4 pb-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">User Management</h1>
          <p className="text-muted text-xs mt-0.5">Manage clients and their access permissions</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{background:'#10b981', color:'#0a0e1a'}}>
          <UserPlus size={14} />Add User
        </button>
      </div>

      {/* Add User Form */}
      {showAdd && (
        <div className="card space-y-4 border border-accent/20">
          <div className="flex items-center justify-between">
            <h3 className="text-data text-sm font-semibold">Create New User</h3>
            <button onClick={() => { setShowAdd(false); setError('') }} className="text-muted hover:text-data"><X size={16} /></button>
          </div>
          {error && <p className="text-loss text-xs p-2 bg-loss/10 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted text-xs block mb-1">Username</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                autoComplete="off" name="new-username"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50"
                placeholder="e.g. Rahul" />
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">Email</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="off" name="new-email"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50"
                placeholder="rahul@gmail.com" />
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                  className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-data text-sm focus:outline-none focus:border-accent/50"
                  placeholder="Strong password" />
                <button onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50">
                <option value="USER">USER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-data text-sm font-medium flex items-center gap-1.5">
                <Shield size={14} className="text-accent" />Tab Permissions
              </label>
              <div className="flex gap-3">
                <button onClick={() => setPerms({ ...DEFAULT_USER_PERMS })} className="text-muted text-xs hover:text-data">Default</button>
                <button onClick={() => setPerms(Object.fromEntries(TABS.map(t => [t.key, true])) as any)} className="text-accent text-xs">All</button>
                <button onClick={() => setPerms(Object.fromEntries(TABS.map(t => [t.key, false])) as any)} className="text-loss text-xs">None</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setPerms(p => ({ ...p, [tab.key]: !p[tab.key as keyof typeof p] }))}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors"
                  style={{
                    borderColor: perms[tab.key as keyof typeof perms] ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
                    background: perms[tab.key as keyof typeof perms] ? 'rgba(16,185,129,0.05)' : '#1f2937'
                  }}>
                  <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                    style={{
                      background: perms[tab.key as keyof typeof perms] ? '#10b981' : 'transparent',
                      borderColor: perms[tab.key as keyof typeof perms] ? '#10b981' : 'rgba(255,255,255,0.2)'
                    }}>
                    {perms[tab.key as keyof typeof perms] && <CheckCircle size={11} style={{color:'#0a0e1a'}} />}
                  </div>
                  <span className="text-xs font-medium" style={{color: perms[tab.key as keyof typeof perms] ? '#10b981' : '#6b7280'}}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{background:'#10b981', color:'#0a0e1a'}}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => { setShowAdd(false); setError('') }}
              className="px-5 py-2.5 rounded-lg bg-surface-2 text-muted text-sm hover:text-data transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="card">
              {/* User row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{background:'rgba(16,185,129,0.1)'}}>
                    <span className="text-sm font-bold" style={{color:'#10b981'}}>{u.username[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-data text-sm font-semibold">{u.username}</p>
                    <p className="text-muted text-xs">{u.email}</p>
                  </div>
                  <span className="badge" style={{
                    background: u.role === 'ADMIN' ? 'rgba(59,130,246,0.15)' : u.role === 'VIEWER' ? 'rgba(107,114,128,0.15)' : 'rgba(16,185,129,0.15)',
                    color: u.role === 'ADMIN' ? '#60a5fa' : u.role === 'VIEWER' ? '#9ca3af' : '#10b981'
                  }}>{u.role}</span>
                </div>
                <div className="flex items-center gap-1">
                  {u.role !== 'ADMIN' && <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                    title="Manage User"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: expandedUser === u.id ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                      color: expandedUser === u.id ? '#10b981' : '#6b7280'
                    }}>
                    {expandedUser === u.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    Manage
                  </button>}
                  <button onClick={() => handleCopy(u.id)} title="Copy email"
                    className="p-2 rounded-lg text-muted hover:text-data transition-colors" style={{background:'rgba(255,255,255,0.04)'}}>
                    {copied === u.id ? <CheckCircle size={14} style={{color:'#10b981'}} /> : <Copy size={14} />}
                  </button>
                  <button onClick={() => handleDelete(u.id)} title="Delete"
                    className="p-2 rounded-lg text-muted hover:text-loss transition-colors" style={{background:'rgba(255,255,255,0.04)'}}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded management panel */}
              {expandedUser === u.id && u.role !== 'ADMIN' && (
                <UserManagePanel user={u} onSaved={fetchUsers} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserManagePanel({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [activeSection, setActiveSection] = useState<'edit' | 'permissions' | 'broker'>('edit')

  const sections = [
    { key: 'edit', label: '✏️ Edit User', color: '#f59e0b' },
    { key: 'permissions', label: '🛡️ Tab Permissions', color: '#10b981' },
    { key: 'broker', label: '🔌 Broker Connection', color: '#60a5fa' },
  ] as const

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      {/* Section tabs */}
      <div className="flex gap-2 mb-4">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: activeSection === s.key ? `${s.color}20` : 'rgba(255,255,255,0.04)',
              color: activeSection === s.key ? s.color : '#6b7280',
              border: `1px solid ${activeSection === s.key ? `${s.color}40` : 'transparent'}`
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'edit' && <EditUser user={user} onSaved={onSaved} />}
      {activeSection === 'permissions' && <PermissionsEditor userId={user.id} />}
      {activeSection === 'broker' && <BrokerConnector userId={user.id} username={user.username} />}
    </div>
  )
}

function EditUser({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [form, setForm] = useState({ username: user.username, email: user.email, password: '', role: user.role })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError(''); setSaving(true)
    try {
      const body: any = { username: form.username, email: form.email, role: form.role }
      if (form.password) body.password = form.password
      const res = await fetch(`${API}/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to update user')
      setSaved(true)
      setTimeout(() => { setSaved(false); onSaved() }, 1500)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-loss text-xs p-2 bg-loss/10 rounded-lg">{error}</p>}
      {saved && <p className="text-accent text-xs p-2 bg-accent/10 rounded-lg">✓ User updated successfully!</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-muted text-xs block mb-1">Username</label>
          <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            autoComplete="off"
            className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50" />
        </div>
        <div>
          <label className="text-muted text-xs block mb-1">Email</label>
          <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            autoComplete="off"
            className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50" />
        </div>
        <div>
          <label className="text-muted text-xs block mb-1">New Password <span className="text-muted text-[10px]">(leave blank to keep)</span></label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              autoComplete="new-password" placeholder="Leave blank to keep current"
              className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-data text-sm focus:outline-none focus:border-accent/50" />
            <button onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-muted text-xs block mb-1">Role</label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50">
            <option value="USER">USER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        style={{background:'#f59e0b', color:'#0a0e1a'}}>
        <Save size={14} />{saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

function PermissionsEditor({ userId }: { userId: number }) {
  const [perms, setPerms] = useState<Record<string, boolean> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/permissions/${userId}`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setPerms(d) })
  }, [userId])

  const save = async () => {
    setSaving(true)
    await fetch(`${API}/api/permissions/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(perms)
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!perms) return <div className="text-muted text-xs py-2">Loading permissions...</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={() => setPerms(Object.fromEntries(TABS.map(t => [t.key, true])) as any)} className="text-accent text-xs">All</button>
          <button onClick={() => setPerms(Object.fromEntries(TABS.map(t => [t.key, false])) as any)} className="text-loss text-xs">None</button>
          <button onClick={() => setPerms({ ...DEFAULT_USER_PERMS })} className="text-muted text-xs hover:text-data">Default</button>
        </div>
        <button onClick={save} disabled={saving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
          style={{background:'#10b981', color:'#0a0e1a'}}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Permissions'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setPerms(p => p ? ({ ...p, [tab.key]: !p[tab.key] }) : p)}
            className="flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors"
            style={{
              borderColor: perms[tab.key] ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
              background: perms[tab.key] ? 'rgba(16,185,129,0.05)' : '#1f2937'
            }}>
            <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
              style={{
                background: perms[tab.key] ? '#10b981' : 'transparent',
                borderColor: perms[tab.key] ? '#10b981' : 'rgba(255,255,255,0.2)'
              }}>
              {perms[tab.key] && <span style={{color:'#0a0e1a', fontSize:'9px', fontWeight:'bold'}}>✓</span>}
            </div>
            <span className="text-xs font-medium" style={{color: perms[tab.key] ? '#10b981' : '#6b7280'}}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BrokerConnector({ userId, username }: { userId: number; username: string }) {
  const [form, setForm] = useState({ clientCode: '', apiKey: '', password: '', totpSecret: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connected, setConnected] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/admin/broker/${userId}`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setConnected(d) })
      .catch(() => {})
  }, [userId])

  const handleConnect = async () => {
    setError(''); setSuccess(''); setSaving(true)
    try {
      const res = await fetch(`${API}/api/admin/broker/${userId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form)
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to connect') }
      const data = await res.json()
      setConnected(data)
      setIsEditing(false)
      setSuccess('✓ Broker connected successfully!')
      setForm({ clientCode: '', apiKey: '', password: '', totpSecret: '' })
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ok: boolean; msg: string} | null>(null)

  const handleTest = async () => {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch(`${API}/api/admin/broker/${userId}/test`, {
        method: 'POST', headers: getAuthHeaders()
      })
      const d = await res.json()
      setTestResult({ ok: res.ok, msg: res.ok ? `✓ ${d.message}` : `✗ ${d.error}` })
    } catch (e: any) { setTestResult({ ok: false, msg: `✗ ${e.message}` }) }
    finally { setTesting(false) }
  }

  const handleDisconnect = async () => {
    if (!window.confirm(`Disconnect ${username}'s Angel One account?`)) return
    await fetch(`${API}/api/admin/broker/${userId}/disconnect`, { method: 'DELETE', headers: getAuthHeaders() })
    setConnected(null)
    setSuccess('')
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-loss text-xs p-2 bg-loss/10 rounded-lg">{error}</p>}
      {success && <p className="text-accent text-xs p-2 bg-accent/10 rounded-lg">{success}</p>}

      {/* Connected status */}
      {connected && !isEditing && (
        <div className="p-3 rounded-lg border"
          style={{background:'rgba(16,185,129,0.05)', borderColor:'rgba(16,185,129,0.2)'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{color:'#10b981'}}>✅ Angel One Connected</p>
              <p className="text-muted text-xs mt-1">Client Code: <span className="text-data font-mono">{connected.clientCode}</span></p>
              <p className="text-muted text-xs">Since: {new Date(connected.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleTest} disabled={testing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}>
                {testing ? '⏳ Testing...' : '🔌 Test'}
              </button>
              <button onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}>
                ✏️ Update
              </button>
              <button onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{background:'rgba(239,68,68,0.1)', color:'#ef4444'}}>
                Disconnect
              </button>
            </div>
          </div>
          {testResult && (
            <div className="mt-2 p-2 rounded-lg text-xs font-medium"
              style={{
                background: testResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: testResult.ok ? '#10b981' : '#ef4444'
              }}>
              {testResult.msg}
            </div>
          )}
        </div>
      )}

      {/* Connection form */}
      {(!connected || isEditing) && (
        <>
          <p className="text-muted text-xs">
            {isEditing ? `Update ${username}'s Angel One credentials:` : `Enter ${username}'s Angel One credentials to connect:`}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted text-xs block mb-1">Client Code</label>
              <input value={form.clientCode} onChange={e => setForm(p => ({ ...p, clientCode: e.target.value }))}
                autoComplete="off" name="broker-client"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm font-mono focus:outline-none focus:border-accent/50"
                placeholder="e.g. AAAL701361" />
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">API Key</label>
              <input value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
                autoComplete="off" name="broker-api"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm font-mono focus:outline-none focus:border-accent/50"
                placeholder="e.g. De4QEDxr" />
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                  className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-data text-sm focus:outline-none focus:border-accent/50"
                  placeholder="Angel One PIN" />
                <button onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">TOTP Secret</label>
              <input value={form.totpSecret} onChange={e => setForm(p => ({ ...p, totpSecret: e.target.value }))}
                autoComplete="off" name="broker-totp"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm font-mono focus:outline-none focus:border-accent/50"
                placeholder="Base32 secret key" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleConnect} disabled={saving || !form.clientCode || !form.apiKey}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{background:'#60a5fa', color:'#0a0e1a'}}>
              <Plug size={14} />
              {saving ? 'Connecting...' : isEditing ? 'Update Credentials' : `Connect ${username}'s Angel One`}
            </button>
            {isEditing && (
              <button onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-lg bg-surface-2 text-muted text-sm hover:text-data transition-colors">
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

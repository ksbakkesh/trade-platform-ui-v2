'use client'
import { useState, useRef, useEffect } from 'react'
import { useAuth, getAuthHeaders } from '@/lib/auth'
import { Settings, X, Eye, EyeOff, Save, User } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function ProfileMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'profile' | 'password'>('profile')
  const ref = useRef<HTMLDivElement>(null)

  // Profile form (ADMIN only)
  const [profile, setProfile] = useState({ username: user?.username || '', email: user?.email || '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ok: boolean; msg: string} | null>(null)

  // Password form (all users)
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ok: boolean; msg: string} | null>(null)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const saveProfile = async () => {
    setProfileSaving(true); setProfileMsg(null)
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ username: profile.username, email: profile.email })
      })
      if (!res.ok) throw new Error('Failed to update profile')
      setProfileMsg({ ok: true, msg: '✓ Profile updated! Please log in again.' })
      setTimeout(() => logout(), 2000)
    } catch (e: any) { setProfileMsg({ ok: false, msg: e.message }) }
    finally { setProfileSaving(false) }
  }

  const savePassword = async () => {
    if (pwd.newPwd !== pwd.confirm) { setPwdMsg({ ok: false, msg: 'New passwords do not match' }); return }
    if (pwd.newPwd.length < 6) { setPwdMsg({ ok: false, msg: 'Password must be at least 6 characters' }); return }
    setPwdSaving(true); setPwdMsg(null)
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.newPwd })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to change password') }
      setPwdMsg({ ok: true, msg: '✓ Password changed successfully!' })
      setPwd({ current: '', newPwd: '', confirm: '' })
    } catch (e: any) { setPwdMsg({ ok: false, msg: e.message }) }
    finally { setPwdSaving(false) }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg transition-colors hover:bg-surface-2"
        title="Profile & Settings">
        <Settings size={15} className="text-muted" />
      </button>

      {open && (
        <div className="fixed right-4 top-14 w-80 rounded-xl shadow-2xl z-[9999] overflow-hidden"
          style={{background:'#111827', border:'1px solid rgba(255,255,255,0.08)'}}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{background:'rgba(16,185,129,0.15)'}}>
                <span className="text-xs font-bold" style={{color:'#10b981'}}>
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-data text-xs font-semibold">{user?.username}</p>
                <p className="text-muted text-[10px]">{user?.role}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-data">
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            {isAdmin && (
              <button onClick={() => setTab('profile')}
                className="flex-1 py-2 text-xs font-medium transition-colors"
                style={{
                  color: tab === 'profile' ? '#10b981' : '#6b7280',
                  borderBottom: tab === 'profile' ? '2px solid #10b981' : '2px solid transparent'
                }}>
                <User size={11} className="inline mr-1" />Profile
              </button>
            )}
            <button onClick={() => setTab('password')}
              className="flex-1 py-2 text-xs font-medium transition-colors"
              style={{
                color: tab === 'password' ? '#10b981' : '#6b7280',
                borderBottom: tab === 'password' ? '2px solid #10b981' : '2px solid transparent'
              }}>
              🔑 Password
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Profile Tab - ADMIN only */}
            {tab === 'profile' && isAdmin && (
              <>
                {profileMsg && (
                  <p className="text-xs p-2 rounded-lg"
                    style={{
                      background: profileMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: profileMsg.ok ? '#10b981' : '#ef4444'
                    }}>{profileMsg.msg}</p>
                )}
                <div>
                  <label className="text-muted text-[10px] block mb-1">Username</label>
                  <input value={profile.username}
                    onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-data text-sm focus:outline-none"
                    style={{background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)'}} />
                </div>
                <div>
                  <label className="text-muted text-[10px] block mb-1">Email</label>
                  <input value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-data text-sm focus:outline-none"
                    style={{background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)'}} />
                </div>
                <button onClick={saveProfile} disabled={profileSaving}
                  className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{background:'#10b981', color:'#0a0e1a'}}>
                  <Save size={13} />{profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <p className="text-muted text-[10px] text-center">You will be logged out after saving</p>
              </>
            )}

            {/* Password Tab - all users */}
            {tab === 'password' && (
              <>
                {pwdMsg && (
                  <p className="text-xs p-2 rounded-lg"
                    style={{
                      background: pwdMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: pwdMsg.ok ? '#10b981' : '#ef4444'
                    }}>{pwdMsg.msg}</p>
                )}
                <div>
                  <label className="text-muted text-[10px] block mb-1">Current Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={pwd.current}
                      onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 pr-8 text-data text-sm focus:outline-none"
                      style={{background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)'}}
                      placeholder="Current password" />
                    <button onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                      {showPwd ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-muted text-[10px] block mb-1">New Password</label>
                  <input type={showPwd ? 'text' : 'password'} value={pwd.newPwd}
                    onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-data text-sm focus:outline-none"
                    style={{background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)'}}
                    placeholder="New password (min 6 chars)" />
                </div>
                <div>
                  <label className="text-muted text-[10px] block mb-1">Confirm New Password</label>
                  <input type={showPwd ? 'text' : 'password'} value={pwd.confirm}
                    onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-data text-sm focus:outline-none"
                    style={{background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)'}}
                    placeholder="Repeat new password" />
                </div>
                <button onClick={savePassword} disabled={pwdSaving || !pwd.current || !pwd.newPwd}
                  className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{background:'#10b981', color:'#0a0e1a'}}>
                  <Save size={13} />{pwdSaving ? 'Saving...' : 'Change Password'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

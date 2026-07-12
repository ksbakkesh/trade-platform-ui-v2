'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, X, Trash2, Check } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Notification { id: number; title: string; message: string; type: string; isRead: boolean; createdAt: string }

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const fetchCount = async () => {
    try {
      const res = await fetch(`${API}/notifications/unread-count`, { headers: getAuthHeaders() })
      if (res.ok) { const d = await res.json(); setUnreadCount(d.count) }
    } catch {}
  }

  const fetchAll = async () => {
    try {
      const res = await fetch(`${API}/notifications`, { headers: getAuthHeaders() })
      if (res.ok) setNotifications(await res.json())
    } catch {}
  }

  const markAllRead = async () => {
    await fetch(`${API}/notifications/mark-all-read`, { method: 'POST', headers: getAuthHeaders() })
    setUnreadCount(0)
    setNotifications(p => p.map(n => ({ ...n, isRead: true })))
  }

  const deleteOne = async (id: number) => {
    await fetch(`${API}/notifications/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
    setNotifications(p => p.filter(n => n.id !== id))
  }

  useEffect(() => { fetchCount(); const t = setInterval(fetchCount, 30000); return () => clearInterval(t) }, [])
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open) { fetchAll(); if (unreadCount > 0) markAllRead() }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 rounded-lg hover:bg-surface-2 transition-colors">
        <Bell size={14} className="text-muted" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-loss text-bg text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 top-14 w-80 bg-surface border border-white/10 rounded-xl shadow-2xl z-[9999]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-data text-xs font-semibold">Notifications</p>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-muted hover:text-accent text-[10px] flex items-center gap-1">
                  <Check size={10} />Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted hover:text-data"><X size={13} /></button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="text-muted mx-auto mb-2 opacity-40" />
                <p className="text-muted text-xs">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-white/5 hover:bg-surface-2 ${!n.isRead ? 'bg-accent/5' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-data text-xs font-semibold">{n.title}</p>
                    <p className="text-muted text-[11px] mt-0.5">{n.message}</p>
                    <p className="text-muted text-[10px] mt-1 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => deleteOne(n.id)} className="text-muted hover:text-loss shrink-0">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5 text-center">
              <p className="text-muted text-[10px]">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { Menu, RefreshCw } from 'lucide-react'
import { useAuth, getAuthHeaders } from '@/lib/auth'
import NotificationBell from './NotificationBell'
import ProfileMenu from './ProfileMenu'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth()
  const [niftyLtp, setNiftyLtp] = useState<number | null>(null)
  const [marketOpen, setMarketOpen] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fetchLtp = async () => {
      try {
        const res = await fetch(`${API}/api/test/angelone/quote?exchange=NSE&token=99926000&mode=LTP`, {
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const data = await res.json()
          if (data.fetched?.[0]?.ltp) setNiftyLtp(data.fetched[0].ltp)
        }
      } catch {}
    }
    fetchLtp()
    const t = setInterval(fetchLtp, 300000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const h = time.getHours()
    const m = time.getMinutes()
    const isWeekday = time.getDay() >= 1 && time.getDay() <= 5
    const afterOpen = h > 9 || (h === 9 && m >= 15)
    const beforeClose = h < 15 || (h === 15 && m <= 30)
    setMarketOpen(isWeekday && afterOpen && beforeClose)
  }, [time])

  const ist = time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="h-12 bg-surface border-b border-white/5 flex items-center px-4 gap-3 shrink-0">
      <button onClick={onMenuClick} className="lg:hidden text-muted hover:text-data">
        <Menu size={18} />
      </button>

      {/* Market status */}
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-accent animate-pulse' : 'bg-muted'}`} />
        <span className={`text-xs font-medium ${marketOpen ? 'text-accent' : 'text-muted'}`}>
          {marketOpen ? 'Market Open' : 'Market Closed'}
        </span>
        <span className="text-muted text-xs font-mono">{ist}</span>
      </div>

      {/* NIFTY */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-2">
        <span className="text-muted text-[10px]">NIFTY 50</span>
        <span className="text-data text-xs font-mono font-semibold">
          {niftyLtp ? niftyLtp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
        </span>
      </div>

      <div className="flex-1" />

      <NotificationBell />
      <ProfileMenu />

      {/* User badge */}
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-2">
        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-accent text-[10px] font-bold">{user?.username?.[0]?.toUpperCase()}</span>
        </div>
        <div className="hidden sm:block">
          <p className="text-data text-[11px] font-medium leading-none">{user?.username}</p>
          <p className="text-muted text-[9px] mt-0.5">{user?.role}</p>
        </div>
      </div>
    </header>
  )
}

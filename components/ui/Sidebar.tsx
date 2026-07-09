'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  LayoutDashboard, TrendingUp, Activity, BarChart2, ClipboardList,
  BookOpen, Shield, Wallet, Settings, Users, Globe, ScrollText, Zap,
  FileBarChart, Plug, LogOut, ChevronRight
} from 'lucide-react'

const NAV = [
  { href: '/',         label: 'Dashboard',        icon: LayoutDashboard, perm: 'dashboard' },
  { href: '/market',   label: 'Market Overview',   icon: Globe,           perm: 'marketOverview' },
  { href: '/signals',  label: 'Live Signals',      icon: Activity,        perm: 'liveSignals' },
  { href: '/positions',label: 'Positions',          icon: BarChart2,       perm: 'positions' },
  { href: '/trades',   label: 'Trade History',     icon: TrendingUp,      perm: 'tradeHistory' },
  { href: '/orders',   label: 'Orders',            icon: ClipboardList,   perm: 'orders' },
  { href: '/risk',     label: 'Risk Management',   icon: Shield,          perm: 'riskManagement' },
  { href: '/funds',    label: 'Funds & Margin',    icon: Wallet,          perm: 'fundsMargin' },
  { href: '/broker',   label: 'Broker Setup',      icon: Plug,            perm: 'brokerSetup' },
  { href: '/strategy', label: 'Strategy Setup',    icon: Zap,             perm: 'dashboard' },
  { href: '/settings', label: 'Strategy Settings', icon: Settings,        perm: 'strategySettings' },
  { href: '/config',   label: 'Configuration',     icon: BookOpen,        perm: 'configuration' },
  { href: '/logs',     label: 'Logs',              icon: ScrollText,      perm: 'logs' },
  { href: '/reports',  label: 'Reports',           icon: FileBarChart,    perm: 'reports' },
  { href: '/users',    label: 'User Management',   icon: Users,           perm: 'userManagement' },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, permissions, logout } = useAuth()

  const visibleNav = NAV.filter(item => {
    const perm = item.perm as keyof typeof permissions
    return permissions[perm] === true
  })

  return (
    <div className="flex flex-col h-full bg-surface border-r border-white/5">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-sm">AT</span>
          </div>
          <div>
            <p className="text-data text-xs font-bold">Options Auto Trader</p>
            <p className="text-muted text-[10px]">NIFTY & SENSEX</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {visibleNav.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-colors group ${
                active ? 'bg-accent/10 text-accent' : 'text-muted hover:text-data hover:bg-surface-2'
              }`}>
              <Icon size={15} />
              <span className="text-xs font-medium">{item.label}</span>
              {active && <ChevronRight size={12} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <span className="text-accent text-[10px] font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-data text-xs font-medium truncate">{user?.username}</p>
            <p className="text-muted text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-loss hover:bg-loss/10 transition-colors text-xs">
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </div>
  )
}

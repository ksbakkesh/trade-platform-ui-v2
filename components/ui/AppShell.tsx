'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import RouteGuard from './RouteGuard'
import BrokerAlert from './BrokerAlert'
import { Menu, X } from 'lucide-react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loading } = useAuth()

  if (pathname === '/login') return <>{children}</>
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  )

  return (
    <RouteGuard>
      <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-52 shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-52">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <BrokerAlert />
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}

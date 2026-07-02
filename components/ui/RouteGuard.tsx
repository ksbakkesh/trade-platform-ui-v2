'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const ROUTE_PERMS: Record<string, keyof ReturnType<typeof useAuth>['permissions']> = {
  '/market':    'marketOverview',
  '/signals':   'liveSignals',
  '/positions': 'positions',
  '/trades':    'tradeHistory',
  '/orders':    'orders',
  '/risk':      'riskManagement',
  '/funds':     'fundsMargin',
  '/broker':    'brokerSetup',
  '/settings':  'strategySettings',
  '/config':    'configuration',
  '/logs':      'logs',
  '/reports':   'reports',
  '/users':     'userManagement',
}

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, permissions, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    const required = ROUTE_PERMS[pathname]
    if (required && !permissions[required]) {
      router.push('/')
    }
  }, [user, permissions, loading, pathname])

  if (loading) return null
  if (!user) return null
  return <>{children}</>
}

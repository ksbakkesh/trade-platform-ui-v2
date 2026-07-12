'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface User {
  userId: number
  username: string
  email: string
  role: string
  token: string
}

export interface Permissions {
  dashboard: boolean
  marketOverview: boolean
  liveSignals: boolean
  positions: boolean
  tradeHistory: boolean
  orders: boolean
  riskManagement: boolean
  fundsMargin: boolean
  brokerSetup: boolean
  strategySettings: boolean
  configuration: boolean
  logs: boolean
  reports: boolean
  userManagement: boolean
}

export const DEFAULT_PERMISSIONS: Permissions = {
  dashboard: true, marketOverview: false, liveSignals: true,
  positions: true, tradeHistory: true, orders: false,
  riskManagement: true, fundsMargin: false, brokerSetup: false,
  strategySettings: false, configuration: false, logs: false,
  reports: false, userManagement: false,
}

export const ADMIN_PERMISSIONS: Permissions = {
  dashboard: true, marketOverview: true, liveSignals: true,
  positions: true, tradeHistory: true, orders: true,
  riskManagement: true, fundsMargin: true, brokerSetup: true,
  strategySettings: true, configuration: true, logs: true,
  reports: true, userManagement: true,
}

interface AuthCtx {
  user: User | null
  permissions: Permissions
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({
  user: null, permissions: DEFAULT_PERMISSIONS,
  loading: true, login: async () => {}, logout: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchPermissions = async (token: string, role: string) => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      setPermissions(ADMIN_PERMISSIONS)
      localStorage.setItem('tp_permissions', JSON.stringify(ADMIN_PERMISSIONS))
      return
    }
    try {
      const res = await fetch(`${API}/permissions/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPermissions(data)
        localStorage.setItem('tp_permissions', JSON.stringify(data))
      }
    } catch {}
  }

  const fetchBroker = async (token: string) => {
    try {
      const res = await fetch(`${API}/broker/my-account`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('tp_broker', String(data.id))
      }
    } catch {}
  }

  useEffect(() => {
    const stored = localStorage.getItem('tp_user')
    const storedPerms = localStorage.getItem('tp_permissions')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setUser(u)
        if (storedPerms) setPermissions(JSON.parse(storedPerms))
        if (!localStorage.getItem('tp_broker')) fetchBroker(u.token)
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Invalid email or password')
    const data = await res.json()
    const u: User = {
      userId: data.userId, username: data.username,
      email: data.email, role: data.role, token: data.token
    }
    localStorage.setItem('tp_user', JSON.stringify(u))
    setUser(u)
    await Promise.all([fetchPermissions(data.token, data.role), fetchBroker(data.token)])
    router.push('/')
  }

  const logout = () => {
    localStorage.removeItem('tp_user')
    localStorage.removeItem('tp_broker')
    localStorage.removeItem('tp_permissions')
    setUser(null)
    setPermissions(DEFAULT_PERMISSIONS)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }

export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem('tp_user')
  if (!stored) return {}
  try {
    const u = JSON.parse(stored)
    return { Authorization: `Bearer ${u.token}` }
  } catch { return {} }
}

export function getAccountId(): number {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem('tp_broker') || '1')
}

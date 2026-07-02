'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try { await login(email, password) }
    catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-accent font-bold text-2xl">AT</span>
          </div>
          <h1 className="text-data text-xl font-bold">Options Auto Trader</h1>
          <p className="text-muted text-sm mt-1">NIFTY & SENSEX Auto Trading</p>
        </div>

        <div className="card border border-white/10">
          <h2 className="text-data text-sm font-semibold mb-4">Sign In</h2>
          {error && <p className="text-loss text-xs mb-3 p-2 bg-loss/10 rounded-lg">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-muted text-[10px] block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                autoComplete="email"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-muted text-[10px] block mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                autoComplete="current-password"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data text-sm focus:outline-none focus:border-accent/50"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

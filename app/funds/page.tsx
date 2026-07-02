'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Funds {
  availablecash: string
  availableintradaypayin: string
  utiliseddebits: string
  m2mrealized: string
  m2munrealized: string
  net: string
}

export default function FundsPage() {
  const [funds, setFunds] = useState<Funds | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchFunds = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/test/angelone/funds`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setFunds(data)
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      } else {
        setError('Failed to fetch funds from Angel One')
      }
    } catch { setError('Could not connect to Angel One') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchFunds() }, [])

  const parse = (val: string | undefined) => parseFloat(val || '0')
  const availableCash = parse(funds?.availablecash)
  const intradayMargin = parse(funds?.availableintradaypayin)
  const usedMargin = parse(funds?.utiliseddebits)
  const realizedPnl = parse(funds?.m2mrealized)
  const unrealizedPnl = parse(funds?.m2munrealized)
  const netValue = parse(funds?.net)
  const totalMargin = usedMargin + intradayMargin || 1
  const marginUsedPct = Math.round((usedMargin / totalMargin) * 100)

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Funds & Margin</h1>
          <p className="text-muted text-xs mt-0.5">Live Angel One account balance{lastUpdated && ` · Updated ${lastUpdated}`}</p>
        </div>
        <button onClick={fetchFunds} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-bg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-loss/10 border border-loss/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-loss" />
          <p className="text-loss text-xs">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : funds ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card border border-accent/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Wallet size={16} className="text-accent" />
                </div>
                <p className="text-muted text-xs">Available Cash</p>
              </div>
              <p className="text-accent text-2xl font-mono font-bold">₹{availableCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-muted text-[10px] mt-1">Ready to use for trading</p>
            </div>
            <div className="card border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-blue-400" />
                </div>
                <p className="text-muted text-xs">Intraday Margin</p>
              </div>
              <p className="text-blue-400 text-2xl font-mono font-bold">₹{intradayMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-muted text-[10px] mt-1">Available for intraday trades</p>
            </div>
            <div className="card border border-loss/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-loss/10 flex items-center justify-center">
                  <TrendingDown size={16} className="text-loss" />
                </div>
                <p className="text-muted text-xs">Used Margin</p>
              </div>
              <p className="text-loss text-2xl font-mono font-bold">₹{usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-muted text-[10px] mt-1">Blocked in positions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Realized P&L (M2M)', value: realizedPnl, desc: 'Closed position P&L today' },
              { label: 'Unrealized P&L (M2M)', value: unrealizedPnl, desc: 'Open position P&L' },
              { label: 'Net Account Value', value: netValue, desc: 'Total portfolio value', noSign: true },
            ].map(item => (
              <div key={item.label} className="card">
                <p className="text-muted text-[10px] uppercase tracking-wider mb-2">{item.label}</p>
                <p className={`text-xl font-mono font-bold ${item.value >= 0 ? 'text-accent' : 'text-loss'}`}>
                  {!item.noSign && (item.value >= 0 ? '+' : '')}₹{Math.abs(item.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-muted text-[10px] mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="card space-y-3">
            <h3 className="text-data text-sm font-semibold">Margin Utilization</h3>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Used ₹{usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className="text-muted">Total ₹{totalMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${marginUsedPct > 80 ? 'bg-loss' : marginUsedPct > 50 ? 'bg-warn' : 'bg-accent'}`}
                style={{ width: `${Math.min(marginUsedPct, 100)}%` }} />
            </div>
            <p className="text-muted text-[10px]">{marginUsedPct}% of total margin used</p>
          </div>

          <div className="card space-y-2">
            <h3 className="text-data text-sm font-semibold mb-3">Full Breakdown</h3>
            {[
              { label: 'Available Cash', value: `₹${availableCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-accent' },
              { label: 'Intraday Margin', value: `₹${intradayMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-blue-400' },
              { label: 'Used Margin', value: `₹${usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-loss' },
              { label: 'Realized P&L', value: `${realizedPnl >= 0 ? '+' : ''}₹${Math.abs(realizedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: realizedPnl >= 0 ? 'text-accent' : 'text-loss' },
              { label: 'Unrealized P&L', value: `${unrealizedPnl >= 0 ? '+' : ''}₹${Math.abs(unrealizedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: unrealizedPnl >= 0 ? 'text-accent' : 'text-loss' },
              { label: 'Net Value', value: `₹${netValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-data' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
                <p className="text-muted text-xs">{item.label}</p>
                <p className={`font-mono text-sm font-semibold ${item.cls}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : !error && (
        <div className="card text-center py-12">
          <Wallet size={32} className="text-muted mx-auto mb-3 opacity-50" />
          <p className="text-muted text-sm">No fund data available</p>
          <p className="text-muted text-xs mt-1">Make sure Angel One is connected</p>
        </div>
      )}
    </div>
  )
}

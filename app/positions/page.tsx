'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, TrendingUp, TrendingDown, Shield } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getAccountId() {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem('tp_broker') || '1')
}

interface Position {
  positionId: number
  tradeId: number
  tradingSymbol: string
  quantityRemaining: number
  currentLtp: number | null
  currentStopLoss: number
  unrealizedPnl: number | null
  slMovedToCost: boolean
  lastUpdatedAt: string
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchPositions = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API}/api/dashboard/positions?accountId=${getAccountId()}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        setPositions(await res.json())
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPositions() }, [])

  const totalPnl = positions.reduce((sum, p) => sum + (p.unrealizedPnl ?? 0), 0)

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Open Positions</h1>
          <p className="text-muted text-xs mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            {lastUpdated && ` · Updated ${lastUpdated}`}
          </p>
        </div>
        <button onClick={fetchPositions} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-bg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Open Positions</p>
          <p className="text-data text-2xl font-mono font-bold mt-1">{positions.length}</p>
          <p className="text-muted text-[10px] mt-0.5">active trades</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Unrealized P&L</p>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalPnl >= 0 ? 'text-accent' : 'text-loss'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-muted text-[10px] mt-0.5">total unrealized</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">SL Moved</p>
          <p className="text-warn text-2xl font-mono font-bold mt-1">
            {positions.filter(p => p.slMovedToCost).length}
          </p>
          <p className="text-muted text-[10px] mt-0.5">moved to cost</p>
        </div>
      </div>

      {/* Positions */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : positions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={20} className="text-muted" />
          </div>
          <p className="text-muted text-sm">No open positions</p>
          <p className="text-muted text-xs mt-1">Positions will appear here when trades are placed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map(pos => {
            const pnl = pos.unrealizedPnl ?? 0
            const pnlPositive = pnl >= 0
            return (
              <div key={pos.positionId} className={`card border ${pnlPositive ? 'border-accent/20' : 'border-loss/20'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${pnlPositive ? 'bg-accent' : 'bg-loss'}`} />
                    <span className="text-data font-mono font-semibold text-sm">{pos.tradingSymbol}</span>
                    <span className="badge badge-green">OPEN</span>
                    {pos.slMovedToCost && (
                      <span className="badge badge-amber flex items-center gap-1">
                        <Shield size={10} />SL → Cost
                      </span>
                    )}
                  </div>
                  <span className="text-muted text-[10px] font-mono">
                    {new Date(pos.lastUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox label="Qty Remaining" value={String(pos.quantityRemaining)} />
                  <StatBox label="Current LTP"
                    value={pos.currentLtp ? `₹${pos.currentLtp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'} />
                  <StatBox label="Stop Loss"
                    value={`₹${pos.currentStopLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    cls="text-loss" />
                  <StatBox label="Unrealized P&L"
                    value={`${pnlPositive ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    cls={pnlPositive ? 'text-accent' : 'text-loss'} />
                </div>

                {/* SL status bar */}
                <div className={`mt-3 p-2 rounded-lg text-xs ${pos.slMovedToCost ? 'bg-warn/10 border border-warn/20' : 'bg-surface-2'}`}>
                  {pos.slMovedToCost ? (
                    <p className="text-warn flex items-center gap-1.5">
                      <Shield size={12} />
                      <span className="font-medium">Stop Loss moved to cost price</span>
                      <span className="text-muted ml-1">— position is protected, no loss possible</span>
                    </p>
                  ) : (
                    <p className="text-muted">
                      SL at ₹{pos.currentStopLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })} · Will move to cost after Target 1 hit
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      {positions.length > 0 && (
        <div className="p-3 rounded-lg bg-surface-2 border border-white/5 text-xs text-muted">
          <span className="text-data font-medium">Live P&L: </span>
          Refresh every 15 minutes during market hours to see updated LTP and P&L.
          WebSocket real-time updates coming soon.
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, cls = 'text-data' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="p-3 rounded-lg bg-surface-2">
      <p className="text-muted text-[10px]">{label}</p>
      <p className={`font-mono font-semibold text-sm mt-0.5 ${cls}`}>{value}</p>
    </div>
  )
}

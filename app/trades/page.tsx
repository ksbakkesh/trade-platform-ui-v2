'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getAccountId() {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem('tp_broker') || '1')
}

interface Trade {
  id: number
  indexName: string
  tradingSymbol: string
  transactionType: string
  quantity: number
  entryPrice: number
  stopLossPrice: number
  target1Price: number
  target2Price: number
  exitPrice: number | null
  brokerOrderId: string | null
  status: string
  exitReason: string | null
  realizedPnl: number | null
  reentry: boolean
  entryTime: string
  exitTime: string | null
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'badge-green',
  PARTIALLY_CLOSED: 'badge-amber',
  CLOSED: 'badge-muted',
  CANCELLED: 'badge-red',
  REJECTED: 'badge-red',
}

const EXIT_LABELS: Record<string, string> = {
  TARGET1: 'T1 Hit',
  TARGET2: 'T2 Hit',
  STOP_LOSS: 'SL Hit',
  MANUAL: 'Manual',
  SQUARE_OFF: 'Square Off',
}

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API}/dashboard/trades/today?accountId=${getAccountId()}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        setTrades(await res.json())
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTrades() }, [])

  const filtered = trades.filter(t => {
    if (filter === 'ALL') return true
    if (filter === 'OPEN') return t.status === 'OPEN' || t.status === 'PARTIALLY_CLOSED'
    return t.status === 'CLOSED' || t.status === 'CANCELLED' || t.status === 'REJECTED'
  })

  const totalPnl = trades.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0)
  const openCount = trades.filter(t => t.status === 'OPEN' || t.status === 'PARTIALLY_CLOSED').length
  const closedCount = trades.filter(t => t.status === 'CLOSED').length
  const winCount = trades.filter(t => (t.realizedPnl ?? 0) > 0).length

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Trade History</h1>
          <p className="text-muted text-xs mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            {lastUpdated && ` · Updated ${lastUpdated}`}
          </p>
        </div>
        <button onClick={fetchTrades} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-bg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Total Trades</p>
          <p className="text-data text-2xl font-mono font-bold mt-1">{trades.length}</p>
          <p className="text-muted text-[10px] mt-0.5">today</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Realized P&L</p>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalPnl >= 0 ? 'text-accent' : 'text-loss'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-muted text-[10px] mt-0.5">total today</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Win Rate</p>
          <p className="text-accent text-2xl font-mono font-bold mt-1">
            {closedCount > 0 ? Math.round((winCount / closedCount) * 100) : 0}%
          </p>
          <p className="text-muted text-[10px] mt-0.5">{winCount}/{closedCount} closed</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Open</p>
          <p className="text-warn text-2xl font-mono font-bold mt-1">{openCount}</p>
          <p className="text-muted text-[10px] mt-0.5">active positions</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['ALL', 'OPEN', 'CLOSED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-accent/20 text-accent' : 'text-muted hover:text-data hover:bg-surface-2'
            }`}>
            {f} ({f === 'ALL' ? trades.length : f === 'OPEN' ? openCount : closedCount})
          </button>
        ))}
      </div>

      {/* Trade list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp size={32} className="text-muted mx-auto mb-3 opacity-50" />
          <p className="text-muted text-sm">No trades today</p>
          <p className="text-muted text-xs mt-1">Trades will appear here when orders are placed at 9:15 AM</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(trade => {
            const pnl = trade.realizedPnl ?? 0
            const pnlPositive = pnl >= 0
            const isOpen = trade.status === 'OPEN' || trade.status === 'PARTIALLY_CLOSED'
            return (
              <div key={trade.id} className={`card border ${isOpen ? 'border-accent/20' : pnlPositive ? 'border-accent/10' : 'border-loss/10'}`}>
                {/* Trade header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {pnlPositive
                      ? <TrendingUp size={15} className="text-accent" />
                      : <TrendingDown size={15} className="text-loss" />
                    }
                    <span className="text-data font-mono font-semibold text-sm">{trade.tradingSymbol}</span>
                    <span className={`badge ${trade.indexName === 'NIFTY' ? 'badge-blue' : 'badge-purple'}`}>
                      {trade.indexName}
                    </span>
                    <span className={`badge ${STATUS_COLORS[trade.status] || 'badge-muted'}`}>
                      {trade.status}
                    </span>
                    {trade.reentry && <span className="badge badge-amber">Re-entry</span>}
                    {trade.exitReason && (
                      <span className={`badge ${trade.exitReason === 'STOP_LOSS' ? 'badge-red' : 'badge-green'}`}>
                        {EXIT_LABELS[trade.exitReason] || trade.exitReason}
                      </span>
                    )}
                  </div>
                  <span className="text-muted text-[10px] font-mono shrink-0">
                    #{trade.id}
                  </span>
                </div>

                {/* Price grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  <PriceBox label="Entry" value={`₹${trade.entryPrice}`} />
                  <PriceBox label="Stop Loss" value={`₹${trade.stopLossPrice}`} cls="text-loss" />
                  <PriceBox label="Target 1" value={`₹${trade.target1Price}`} cls="text-accent" />
                  <PriceBox label="Target 2" value={`₹${trade.target2Price}`} cls="text-accent" />
                  <PriceBox label="Exit" value={trade.exitPrice ? `₹${trade.exitPrice}` : '—'} />
                  <PriceBox label="Qty" value={String(trade.quantity)} />
                </div>

                {/* P&L + Time */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-muted text-[10px]">Entry Time</p>
                      <p className="text-data font-mono">
                        {new Date(trade.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {trade.exitTime && (
                      <div>
                        <p className="text-muted text-[10px]">Exit Time</p>
                        <p className="text-data font-mono">
                          {new Date(trade.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                    {trade.brokerOrderId && (
                      <div>
                        <p className="text-muted text-[10px]">Order ID</p>
                        <p className="text-data font-mono text-[11px]">{trade.brokerOrderId}</p>
                      </div>
                    )}
                  </div>
                  {!isOpen && (
                    <div className="text-right">
                      <p className="text-muted text-[10px]">Realized P&L</p>
                      <p className={`font-mono font-bold text-lg ${pnlPositive ? 'text-accent' : 'text-loss'}`}>
                        {pnlPositive ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PriceBox({ label, value, cls = 'text-data' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="p-2 rounded-lg bg-surface-2">
      <p className="text-muted text-[10px]">{label}</p>
      <p className={`font-mono text-xs font-semibold mt-0.5 ${cls}`}>{value}</p>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getAccountId() {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem('tp_broker') || '1')
}

interface Signal {
  id: number
  indexName: string
  signalType: string
  openPrice: number
  buyAbove: number
  sellBelow: number
  strikePrice: number
  tradingSymbol: string
  premiumAtSignal: number
  rsiValue: number
  volumeRatio: number
  deltaValue: number
  status: string
  rejectionReason: string | null
  generatedAt: string
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'GENERATED' | 'REJECTED'>('ALL')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchSignals = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API}/api/dashboard/signals/today?accountId=${getAccountId()}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setSignals(data)
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSignals() }, [])

  const filtered = signals.filter(s =>
    filter === 'ALL' ? true :
    filter === 'GENERATED' ? s.status === 'GENERATED' :
    s.status === 'REJECTED'
  )

  const generated = signals.filter(s => s.status === 'GENERATED').length
  const rejected = signals.filter(s => s.status === 'REJECTED').length

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Live Signals</h1>
          <p className="text-muted text-xs mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            {lastUpdated && ` · Updated ${lastUpdated}`}
          </p>
        </div>
        <button onClick={fetchSignals} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-bg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Total</p>
          <p className="text-data text-2xl font-mono font-bold mt-1">{signals.length}</p>
          <p className="text-muted text-[10px] mt-0.5">signals today</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Generated</p>
          <p className="text-accent text-2xl font-mono font-bold mt-1">{generated}</p>
          <p className="text-muted text-[10px] mt-0.5">passed all checks</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Rejected</p>
          <p className="text-loss text-2xl font-mono font-bold mt-1">{rejected}</p>
          <p className="text-muted text-[10px] mt-0.5">failed checks</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ALL', 'GENERATED', 'REJECTED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? f === 'GENERATED' ? 'bg-accent/20 text-accent'
                  : f === 'REJECTED' ? 'bg-loss/20 text-loss'
                  : 'bg-surface-2 text-data'
                : 'text-muted hover:text-data hover:bg-surface-2'
            }`}>
            {f} {f !== 'ALL' && `(${f === 'GENERATED' ? generated : rejected})`}
          </button>
        ))}
      </div>

      {/* Signals list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={20} className="text-muted" />
          </div>
          <p className="text-muted text-sm">No {filter === 'ALL' ? '' : filter.toLowerCase()} signals today</p>
          <p className="text-muted text-xs mt-1">
            {filter === 'ALL'
              ? 'Signals appear here when market conditions are checked'
              : filter === 'GENERATED'
              ? 'No signals have passed all entry conditions yet'
              : 'No signals have been rejected today'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(signal => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const isGenerated = signal.status === 'GENERATED'
  const isCE = signal.signalType === 'CE' || signal.signalType?.includes('CE')

  return (
    <div className={`card border ${isGenerated ? 'border-accent/20' : 'border-loss/20'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isGenerated
            ? <CheckCircle size={16} className="text-accent" />
            : <XCircle size={16} className="text-loss" />
          }
          <span className="text-data font-semibold text-sm">{signal.indexName}</span>
          <span className={`badge ${isCE ? 'badge-green' : 'badge-red'}`}>
            {signal.signalType || (isCE ? 'CE' : 'PE')}
          </span>
          <span className={`badge ${isGenerated ? 'badge-green' : 'badge-red'}`}>
            {signal.status}
          </span>
        </div>
        <span className="text-muted text-[10px] font-mono">
          {new Date(signal.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Symbol */}
      {signal.tradingSymbol && (
        <div className="mb-3 p-2 rounded-lg bg-surface-2">
          <p className="text-muted text-[10px]">Symbol</p>
          <p className="text-data font-mono text-sm">{signal.tradingSymbol}</p>
        </div>
      )}

      {/* Gann Levels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <LevelBox label="Open Price" value={`₹${signal.openPrice?.toLocaleString('en-IN')}`} />
        <LevelBox label="Buy Above" value={`₹${signal.buyAbove?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} cls="text-accent" />
        <LevelBox label="Sell Below" value={`₹${signal.sellBelow?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} cls="text-loss" />
        <LevelBox label="Strike" value={signal.strikePrice?.toLocaleString('en-IN')} />
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <IndicatorBox label="Premium" value={`₹${signal.premiumAtSignal}`}
          pass={signal.premiumAtSignal >= 125} threshold="≥ ₹125" />
        <IndicatorBox label="RSI" value={signal.rsiValue?.toFixed(1)}
          pass={signal.rsiValue >= 60} threshold="≥ 60" />
        <IndicatorBox label="Volume Ratio" value={`${signal.volumeRatio?.toFixed(2)}x`}
          pass={signal.volumeRatio >= 2} threshold="≥ 2x" />
      </div>

      {signal.deltaValue != null && (
        <div className="mb-3">
          <IndicatorBox label="Delta" value={signal.deltaValue?.toFixed(3)}
            pass={signal.deltaValue >= 0.45 && signal.deltaValue <= 0.65}
            threshold="0.45 - 0.65" />
        </div>
      )}

      {/* Rejection reason */}
      {!isGenerated && signal.rejectionReason && (
        <div className="p-2 rounded-lg bg-loss/10 border border-loss/20">
          <p className="text-loss text-xs">
            <span className="font-medium">Rejected: </span>{signal.rejectionReason}
          </p>
        </div>
      )}
    </div>
  )
}

function LevelBox({ label, value, cls = 'text-data' }: { label: string; value: any; cls?: string }) {
  return (
    <div className="p-2 rounded-lg bg-surface-2">
      <p className="text-muted text-[10px]">{label}</p>
      <p className={`font-mono text-xs font-semibold mt-0.5 ${cls}`}>{value ?? '—'}</p>
    </div>
  )
}

function IndicatorBox({ label, value, pass, threshold }: {
  label: string; value: any; pass: boolean; threshold: string
}) {
  return (
    <div className={`p-2 rounded-lg border ${pass ? 'bg-accent/5 border-accent/20' : 'bg-loss/5 border-loss/20'}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-muted text-[10px]">{label}</p>
        <span className={`text-[10px] font-bold ${pass ? 'text-accent' : 'text-loss'}`}>
          {pass ? '✓' : '✗'}
        </span>
      </div>
      <p className={`font-mono text-sm font-bold ${pass ? 'text-accent' : 'text-loss'}`}>{value ?? '—'}</p>
      <p className="text-muted text-[10px] mt-0.5">{threshold}</p>
    </div>
  )
}

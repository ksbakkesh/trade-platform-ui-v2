'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, Shield, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import RiskGauge from '@/components/ui/RiskGauge'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getAccountId() {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem('tp_broker') || '1')
}

interface RiskSummary {
  tradingAllowed: boolean
  reason: string
  tradesUsedToday: number
  maxTradesPerDay: number
  remainingTrades: number
  lossUsedToday: number
  dailyLossLimit: number
  remainingLossBudget: number
}

interface DailyPnl {
  tradeDate: string
  totalTrades: number
  totalPnl: number
  dailyLossLimitHit: boolean
  maxTradesHit: boolean
  tradingDisabled: boolean
}

export default function RiskManagementPage() {
  const [risk, setRisk] = useState<RiskSummary | null>(null)
  const [pnl, setPnl] = useState<DailyPnl | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const accountId = getAccountId()
      const [riskRes, pnlRes] = await Promise.allSettled([
        fetch(`${API}/api/dashboard/risk/summary?accountId=${accountId}`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/api/dashboard/risk/daily-pnl?accountId=${accountId}`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null),
      ])
      if (riskRes.status === 'fulfilled') setRisk(riskRes.value)
      if (pnlRes.status === 'fulfilled') setPnl(pnlRes.value)
      setLastUpdated(new Date().toLocaleTimeString('en-IN'))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const lossPercent = risk ? Math.round((risk.lossUsedToday / risk.dailyLossLimit) * 100) : 0
  const tradingAllowed = risk?.tradingAllowed !== false

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Risk Management</h1>
          <p className="text-muted text-xs mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            {lastUpdated && ` · Updated ${lastUpdated}`}
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-bg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${tradingAllowed ? 'bg-accent/10 border-accent/20' : 'bg-loss/10 border-loss/20'}`}>
        {tradingAllowed
          ? <CheckCircle size={20} className="text-accent shrink-0" />
          : <AlertTriangle size={20} className="text-loss shrink-0" />
        }
        <div>
          <p className={`font-semibold text-sm ${tradingAllowed ? 'text-accent' : 'text-loss'}`}>
            {tradingAllowed ? '✓ Trading Allowed — All Within Limits' : '✗ Trading Blocked'}
          </p>
          <p className="text-muted text-xs mt-0.5">{risk?.reason ?? 'Checking risk limits...'}</p>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Trades gauge */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            <h3 className="text-data text-sm font-semibold">Trades Used Today</h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <RiskGauge
              used={risk?.tradesUsedToday ?? 0}
              limit={risk?.maxTradesPerDay ?? 2}
              isCount
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Trades Used</span>
              <span className="text-data font-mono font-semibold">{risk?.tradesUsedToday ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Max Allowed</span>
              <span className="text-data font-mono font-semibold">{risk?.maxTradesPerDay ?? 2}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Remaining</span>
              <span className={`font-mono font-semibold ${(risk?.remainingTrades ?? 2) > 0 ? 'text-accent' : 'text-loss'}`}>
                {risk?.remainingTrades ?? 2}
              </span>
            </div>
          </div>
          {risk?.maxTradesPerDay !== undefined && risk.tradesUsedToday >= risk.maxTradesPerDay && (
            <div className="p-2 rounded-lg bg-loss/10 border border-loss/20">
              <p className="text-loss text-xs text-center">Daily trade limit reached — no new trades today</p>
            </div>
          )}
        </div>

        {/* Loss gauge */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-loss" />
            <h3 className="text-data text-sm font-semibold">Daily Loss Used</h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <RiskGauge
              used={risk?.lossUsedToday ?? 0}
              limit={risk?.dailyLossLimit ?? 4500}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Loss Used</span>
              <span className={`font-mono font-semibold ${(risk?.lossUsedToday ?? 0) > 0 ? 'text-loss' : 'text-data'}`}>
                ₹{(risk?.lossUsedToday ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Daily Limit</span>
              <span className="text-data font-mono font-semibold">
                ₹{(risk?.dailyLossLimit ?? 4500).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Remaining Budget</span>
              <span className={`font-mono font-semibold ${(risk?.remainingLossBudget ?? 4500) > 1000 ? 'text-accent' : 'text-warn'}`}>
                ₹{(risk?.remainingLossBudget ?? 4500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all ${lossPercent > 80 ? 'bg-loss' : lossPercent > 50 ? 'bg-warn' : 'bg-accent'}`}
                style={{ width: `${Math.min(lossPercent, 100)}%` }}
              />
            </div>
            <p className="text-muted text-[10px] text-right">{lossPercent}% of limit used</p>
          </div>
          {risk?.dailyLossLimit !== undefined && (risk?.lossUsedToday ?? 0) >= risk.dailyLossLimit && (
            <div className="p-2 rounded-lg bg-loss/10 border border-loss/20">
              <p className="text-loss text-xs text-center">Daily loss limit hit — trading disabled for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's P&L Summary */}
      <div className="card space-y-3">
        <h3 className="text-data text-sm font-semibold">Today's Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Trades', value: String(pnl?.totalTrades ?? risk?.tradesUsedToday ?? 0), cls: 'text-data' },
            { label: "Today's P&L", value: `${(pnl?.totalPnl ?? 0) >= 0 ? '+' : ''}₹${Math.abs(pnl?.totalPnl ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: (pnl?.totalPnl ?? 0) >= 0 ? 'text-accent' : 'text-loss' },
            { label: 'Loss Limit Hit', value: pnl?.dailyLossLimitHit ? 'Yes' : 'No', cls: pnl?.dailyLossLimitHit ? 'text-loss' : 'text-accent' },
            { label: 'Max Trades Hit', value: pnl?.maxTradesHit ? 'Yes' : 'No', cls: pnl?.maxTradesHit ? 'text-loss' : 'text-accent' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-lg bg-surface-2 text-center">
              <p className="text-muted text-[10px] uppercase tracking-wider">{item.label}</p>
              <p className={`font-mono font-bold text-lg mt-1 ${item.cls}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Rules */}
      <div className="card space-y-3">
        <h3 className="text-data text-sm font-semibold">Risk Rules (BRD Section 9)</h3>
        <div className="space-y-2">
          {[
            { rule: 'Maximum trades per day', value: `${risk?.maxTradesPerDay ?? 2} trades`, desc: 'Combined NIFTY + SENSEX' },
            { rule: 'Daily loss limit', value: `₹${(risk?.dailyLossLimit ?? 4500).toLocaleString('en-IN')}`, desc: 'Auto-stops trading when hit' },
            { rule: 'Scope', value: 'Combined', desc: 'NIFTY + SENSEX share the same budget' },
            { rule: 'Reset time', value: '9:15 AM', desc: 'Counters reset every trading day' },
          ].map(item => (
            <div key={item.rule} className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
              <div>
                <p className="text-data text-xs font-medium">{item.rule}</p>
                <p className="text-muted text-[10px] mt-0.5">{item.desc}</p>
              </div>
              <span className="text-accent font-mono text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import RiskGauge from '@/components/ui/RiskGauge'
import PnlChart from '@/components/ui/PnlChart'
import { api, RiskSummary, Trade, Position } from '@/lib/api'
import { getAuthHeaders } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface GannData {
  indexName: string; openPrice: number; buyAbove: number; sellBelow: number
  ceStrike: number; peStrike: number; spotStopLoss: number
}

export default function Dashboard() {
  const [niftyOpen, setNiftyOpen] = useState('')
  const [sensexOpen, setSensexOpen] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [risk, setRisk] = useState<RiskSummary | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [niftyGann, setNiftyGann] = useState<GannData | null>(null)
  const [sensexGann, setSensexGann] = useState<GannData | null>(null)
  const [niftyLtp, setNiftyLtp] = useState<number | null>(null)
  const [funds, setFunds] = useState<any>(null)
  const [pnlHistory] = useState([
    { time: '09:15', pnl: 0 }, { time: '09:30', pnl: 120 },
    { time: '09:45', pnl: -200 }, { time: '10:00', pnl: 350 },
    { time: '10:15', pnl: 800 }, { time: '10:30', pnl: 650 },
    { time: '10:45', pnl: 1200 }, { time: '11:00', pnl: 950 },
  ])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await fetch(`${API}/api/test/angelone/login`, { method: 'POST' })
      const [riskData, tradesData, posData, fundsData] = await Promise.allSettled([
        api.riskSummary(), api.todayTrades(), api.positions(),
        fetch(`${API}/api/test/angelone/funds`).then(r => r.json()),
      ])
      if (riskData.status === 'fulfilled') setRisk(riskData.value)
      if (tradesData.status === 'fulfilled') setTrades(tradesData.value)
      if (posData.status === 'fulfilled') setPositions(posData.value)
      if (fundsData.status === 'fulfilled') setFunds(fundsData.value)
      try {
        const q = await fetch(`${API}/api/test/angelone/quote?exchange=NSE&token=99926000&mode=LTP`).then(r => r.json())
        if (q.fetched?.[0]?.ltp) setNiftyLtp(q.fetched[0].ltp)
      } catch {}
      if (niftyOpen && parseFloat(niftyOpen) > 1000) {
        try {
          const accountId = localStorage.getItem('tp_broker') || '1'
          const g = await fetch(`${API}/api/dashboard/market/levels?accountId=${accountId}&index=NIFTY&liveOpenPrice=${niftyOpen}`, { headers: getAuthHeaders() }).then(r => r.json())
          if (g.buyAbove) setNiftyGann(g)
        } catch {}
      }
      if (sensexOpen && parseFloat(sensexOpen) > 10000) {
        try {
          const accountId = localStorage.getItem('tp_broker') || '1'
          const g = await fetch(`${API}/api/dashboard/market/levels?accountId=${accountId}&index=SENSEX&liveOpenPrice=${sensexOpen}`, { headers: getAuthHeaders() }).then(r => r.json())
          if (g.buyAbove) setSensexGann(g)
        } catch {}
      }
      setLastRefresh(new Date().toLocaleTimeString('en-IN'))
    } finally { setLoading(false) }
  }, [niftyOpen, sensexOpen])

  const totalPnl = trades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0)
  const openTrades = trades.filter(t => t.status === 'OPEN' || t.status === 'PARTIALLY_CLOSED')

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-data text-base font-semibold">Dashboard</h1>
          <p className="text-muted text-xs">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {lastRefresh && <span className="text-muted text-[10px]">Updated {lastRefresh}</span>}
          <button
            onClick={refresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Today's P&L"
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
          cls={totalPnl >= 0 ? 'text-accent' : 'text-loss'}
          sub={`${trades.length} trade${trades.length !== 1 ? 's' : ''}`} />
        <StatCard label="Trades Left"
          value={`${risk?.remainingTrades ?? 2}/${risk?.maxTradesPerDay ?? 2}`}
          cls="text-data" sub="daily cap" />
        <StatCard label="Loss Used"
          value={`₹${(risk?.lossUsedToday ?? 0).toLocaleString('en-IN')}`}
          cls={(risk?.lossUsedToday ?? 0) > 0 ? 'text-loss' : 'text-data'}
          sub={`of ₹${(risk?.dailyLossLimit ?? 4500).toLocaleString('en-IN')}`} />
        <StatCard label="Status"
          value={risk?.tradingAllowed !== false ? 'Active' : 'Blocked'}
          cls={risk?.tradingAllowed !== false ? 'text-accent' : 'text-loss'}
          sub={risk?.reason ?? 'Loading...'} />
      </div>

      {/* ── Market Overview ── */}
      <Section title="Market Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GannCard
            label="NIFTY 50" color="blue" ltp={niftyLtp}
            openVal={niftyOpen} onOpenChange={setNiftyOpen}
            gann={niftyGann} placeholder="e.g. 24350.50" min={1000}
          />
          <GannCard
            label="SENSEX" color="purple" ltp={null}
            openVal={sensexOpen} onOpenChange={setSensexOpen}
            gann={sensexGann} placeholder="e.g. 80125.75" min={10000}
          />
        </div>
      </Section>

      {/* ── Risk + Account ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Risk */}
        <div className="card space-y-3">
          <h3 className="text-data text-xs font-semibold">Risk Management</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-surface-2">
              <p className="text-muted text-[10px] mb-1">Trades/Day</p>
              <RiskGauge used={risk?.tradesUsedToday ?? 0} limit={risk?.maxTradesPerDay ?? 2} isCount />
              <p className="text-[10px] text-muted mt-1">{risk?.remainingTrades ?? 2} remaining</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-surface-2">
              <p className="text-muted text-[10px] mb-1">Loss Limit</p>
              <RiskGauge used={risk?.lossUsedToday ?? 0} limit={risk?.dailyLossLimit ?? 4500} />
              <p className="text-[10px] text-muted mt-1">₹{(risk?.remainingLossBudget ?? 4500).toLocaleString('en-IN')} left</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-2.5 rounded-lg ${risk?.tradingAllowed !== false ? 'bg-accent/10' : 'bg-loss/10'}`}>
            <span className={`text-xs font-medium ${risk?.tradingAllowed !== false ? 'text-accent' : 'text-loss'}`}>
              {risk?.tradingAllowed !== false ? '✓ Within Risk — All Good' : '✗ Risk Limit Reached'}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { l: 'Max Trades/Day', v: risk?.maxTradesPerDay ?? 2 },
              { l: 'Daily Loss Limit', v: `₹${(risk?.dailyLossLimit ?? 4500).toLocaleString('en-IN')}` },
              { l: 'Scope', v: 'NIFTY + SENSEX' },
              { l: 'Day Status', v: risk?.tradingAllowed !== false ? 'Active' : 'Blocked', accent: true },
            ].map(({ l, v, accent }) => (
              <div key={l} className="flex justify-between">
                <span className="text-muted">{l}</span>
                <span className={`font-mono font-medium ${accent ? (risk?.tradingAllowed !== false ? 'text-accent' : 'text-loss') : 'text-data'}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account Summary */}
        <div className="card space-y-3">
          <h3 className="text-data text-xs font-semibold">Account Summary</h3>
          <div className="space-y-2">
            {[
              { l: 'Available Funds', v: `₹${parseFloat(funds?.availablecash || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-accent' },
              { l: 'Used Margin', v: `₹${parseFloat(funds?.utiliseddebits || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-loss' },
              { l: 'Intraday Margin', v: `₹${parseFloat(funds?.availableintradaypayin || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-accent' },
              { l: 'Collateral', v: `₹${parseFloat(funds?.collateral || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-data' },
              { l: "Today's P&L", v: `${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: totalPnl >= 0 ? 'text-accent' : 'text-loss' },
            ].map(({ l, v, cls }) => (
              <div key={l} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                <span className="text-muted text-xs">{l}</span>
                <span className={`font-mono text-sm font-semibold ${cls}`}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={refresh} disabled={loading}
            className="w-full py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors flex items-center justify-center gap-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh Funds
          </button>
        </div>
      </div>

      {/* ── Active Positions ── */}
      <Section title="Active Positions" badge={`${positions.length} open`}>
        {positions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm">No open positions</p>
            <p className="text-muted text-xs mt-1">Positions appear here when trades are placed</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="text-muted border-b border-white/5">
                  {['Symbol', 'Qty', 'LTP', 'SL', 'Unrealized P&L', 'SL Status'].map(h => (
                    <th key={h} className="text-left pb-2 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.positionId} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-3 font-mono text-data text-[11px]">{p.tradingSymbol}</td>
                    <td className="py-2 pr-3 font-mono">{p.quantityRemaining}</td>
                    <td className="py-2 pr-3 font-mono">{p.currentLtp ? `₹${p.currentLtp}` : '—'}</td>
                    <td className="py-2 pr-3 font-mono text-loss">₹{p.currentStopLoss}</td>
                    <td className={`py-2 pr-3 font-mono font-medium ${(p.unrealizedPnl ?? 0) >= 0 ? 'text-accent' : 'text-loss'}`}>
                      {p.unrealizedPnl != null ? `${p.unrealizedPnl >= 0 ? '+' : ''}₹${Math.abs(p.unrealizedPnl).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-2">{p.slMovedToCost ? <span className="badge badge-amber">SL → Cost</span> : <span className="badge badge-muted">Normal</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── P&L Chart ── */}
      <Section title="Today's P&L" badge={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`} badgeCls={totalPnl >= 0 ? 'text-accent' : 'text-loss'}>
        <PnlChart data={pnlHistory} />
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/5">
          {[
            { l: "Realized P&L", v: `${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: totalPnl >= 0 ? 'text-accent' : 'text-loss' },
            { l: "Unrealized P&L", v: '₹0.00', cls: 'text-muted' },
            { l: "Total Trades", v: String(trades.length), cls: 'text-data' },
          ].map(({ l, v, cls }) => (
            <div key={l} className="text-center">
              <p className="text-muted text-[10px]">{l}</p>
              <p className={`font-mono text-sm font-bold mt-0.5 ${cls}`}>{v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Trade History ── */}
      <Section title="Trade History" badge={`${trades.length} today`}>
        {trades.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">No trades today</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-muted border-b border-white/5">
                  {['Symbol', 'Qty', 'Entry', 'SL', 'T1', 'T2', 'Exit', 'P&L', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-left pb-2 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => {
                  const pnl = t.realizedPnl
                  return (
                    <tr key={t.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 font-mono text-data text-[11px]">{t.tradingSymbol}</td>
                      <td className="py-2 pr-3 font-mono">{t.quantity}</td>
                      <td className="py-2 pr-3 font-mono">₹{t.entryPrice}</td>
                      <td className="py-2 pr-3 font-mono text-loss">₹{t.stopLossPrice}</td>
                      <td className="py-2 pr-3 font-mono text-accent">₹{t.target1Price}</td>
                      <td className="py-2 pr-3 font-mono text-accent">₹{t.target2Price}</td>
                      <td className="py-2 pr-3 font-mono">{t.exitPrice ? `₹${t.exitPrice}` : '—'}</td>
                      <td className={`py-2 pr-3 font-mono font-medium ${pnl == null ? 'text-muted' : pnl >= 0 ? 'text-accent' : 'text-loss'}`}>
                        {pnl != null ? `${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`badge ${t.status === 'OPEN' ? 'badge-green' : t.status === 'CLOSED' ? 'badge-muted' : 'badge-amber'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-muted text-[10px]">
                        {new Date(t.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <p className="text-muted text-[10px] text-center">
        Powered by Angel One SmartAPI · Gann Square Root Method
      </p>
    </div>
  )
}

/* ── Reusable sub-components ── */

function StatCard({ label, value, sub, cls }: { label: string; value: string; sub?: string; cls?: string }) {
  return (
    <div className="card">
      <p className="text-muted text-[10px] font-mono uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-mono font-bold mt-1 ${cls}`}>{value}</p>
      {sub && <p className="text-muted text-[10px] mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

function Section({ title, badge, badgeCls, children }: {
  title: string; badge?: string; badgeCls?: string; children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-data text-xs font-semibold">{title}</h3>
        {badge && <span className={`text-xs font-mono font-semibold ${badgeCls ?? 'text-muted'}`}>{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function GannCard({ label, color, ltp, openVal, onOpenChange, gann, placeholder, min }: {
  label: string; color: string; ltp: number | null
  openVal: string; onOpenChange: (v: string) => void
  gann: GannData | null; placeholder: string; min: number
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
  }
  return (
    <div className="p-3 rounded-xl bg-surface-2 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${colorMap[color]}`}>{label}</span>
          {ltp && <span className="text-data font-mono font-bold text-sm">{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>}
        </div>
        <span className="badge badge-green text-[10px]">Auto</span>
      </div>

      <div>
        <label className="text-muted text-[10px] block mb-1">Open Price (9:15 AM)</label>
        <input
          type="number"
          value={openVal}
          onChange={e => { const v = e.target.value; if (v === '' || parseFloat(v) > 0) onOpenChange(v) }}
          placeholder={placeholder}
          min={min}
          step="0.05"
          className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 text-data font-mono text-sm focus:outline-none focus:border-accent/50"
        />
      </div>

      {gann ? (
        <div className="grid grid-cols-2 gap-2">
          <LevelBox label="Buy Above" value={gann.buyAbove} cls="text-accent" />
          <LevelBox label="Sell Below" value={gann.sellBelow} cls="text-loss" />
          <LevelBox label="Spot SL" value={gann.spotStopLoss} cls="text-warn" />
          <LevelBox label="Open Price" value={gann.openPrice} cls="text-data" />
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-between">
            <div>
              <p className="text-muted text-[10px]">CE Strike</p>
              <p className="text-accent font-mono font-bold">{gann.ceStrike.toLocaleString('en-IN')}</p>
            </div>
            <span className="badge badge-green">CE</span>
          </div>
          <div className="p-2 rounded-lg bg-loss/10 border border-loss/20 flex items-center justify-between">
            <div>
              <p className="text-muted text-[10px]">PE Strike</p>
              <p className="text-loss font-mono font-bold">{gann.peStrike.toLocaleString('en-IN')}</p>
            </div>
            <span className="badge badge-red">PE</span>
          </div>
        </div>
      ) : (
        <p className="text-muted text-xs text-center py-2">Enter open price → click Refresh</p>
      )}
    </div>
  )
}

function LevelBox({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="p-2 rounded-lg bg-bg">
      <p className="text-muted text-[10px]">{label}</p>
      <p className={`font-mono font-bold text-sm mt-0.5 ${cls}`}>
        {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

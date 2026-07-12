'use client'
import { useState, useEffect, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { Wallet, Zap, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function StrategySetupPage() {
  const [funds, setFunds] = useState<any>(null)
  const [niftySettings, setNiftySettings] = useState<any>(null)
  const [sensexSettings, setSensexSettings] = useState<any>(null)
  const [capital, setCapital] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState<number>(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const brokerRes = await fetch(`${API}/broker/my-account`, { headers: getAuthHeaders() })
      let accId = 1
      if (brokerRes.ok) {
        const broker = await brokerRes.json()
        accId = broker.id
        setAccountId(accId)
      }
      const [fundsRes, niftyRes, sensexRes] = await Promise.allSettled([
        fetch(`${API}/dashboard/funds`, { headers: getAuthHeaders() }).then(r => r.json()),
        fetch(`${API}/admin/strategy-settings/account/${accId}/index/NIFTY`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/admin/strategy-settings/account/${accId}/index/SENSEX`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null),
      ])
      if (fundsRes.status === 'fulfilled' && fundsRes.value?.availablecash) {
        setFunds(fundsRes.value)
        setCapital(Math.floor(parseFloat(fundsRes.value.availablecash)).toString())
      }
      if (niftyRes.status === 'fulfilled') setNiftySettings(niftyRes.value)
      if (sensexRes.status === 'fulfilled') setSensexSettings(sensexRes.value)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const activateStrategy = async () => {
    if (!capital || parseFloat(capital) < 1000) {
      setError('Please enter a valid capital amount (minimum ₹1,000)')
      return
    }
    setSaving(true); setError('')
    try {
      const capitalNum = parseFloat(capital)
      const dailyLossLimit = Math.round(capitalNum * 0.05)
      const base = {
        brokerAccountId: accountId, openPriceMode: 'AUTO',
        premiumThreshold: 125, candleTimeframeMinutes: 15,
        rsiThreshold: 60, volumeMultiplier: 2,
        deltaMin: 0.45, deltaMax: 0.65,
        exitStrategyMode: 'OPTION1', reEntryEnabled: true,
        quantityMode: 'CAPITAL_BASED', capitalAllocationPercent: 20,
        autoTradingEnabled: true,
      }
      if (niftySettings) {
        await fetch(`${API}/admin/strategy-settings/${niftySettings.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ ...base, indexName: 'NIFTY', stopLossPoints: 100, target1Points: 160, target2Points: 200 })
        })
      }
      if (sensexSettings) {
        await fetch(`${API}/admin/strategy-settings/${sensexSettings.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ ...base, indexName: 'SENSEX', stopLossPoints: 400, target1Points: 640, target2Points: 800 })
        })
      }
      await fetch(`${API}/admin/risk-settings/account/${accountId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ brokerAccountId: accountId, maxTradesPerDay: 2, dailyLossLimit })
      })
      setSaved(true); setTimeout(() => setSaved(false), 4000); loadData()
    } catch { setError('Failed to activate strategy. Please try again.') }
    finally { setSaving(false) }
  }

  const availableCash = parseFloat(funds?.availablecash || '0')
  const capitalNum = parseFloat(capital || '0')
  const capitalPercent = availableCash > 0 ? Math.round((capitalNum / availableCash) * 100) : 0

  return (
    <div className="space-y-5 pb-8 max-w-4xl">
      <div>
        <h1 className="text-data text-base font-semibold">Strategy Setup</h1>
        <p className="text-muted text-xs mt-0.5">Set your capital and activate auto-trading for today</p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
          <CheckCircle size={14} className="text-accent" />
          <p className="text-accent text-xs font-medium">Strategy activated! Auto-trading is now live for NIFTY + SENSEX.</p>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-loss/10 border border-loss/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-loss" />
          <p className="text-loss text-xs">{error}</p>
        </div>
      )}

      <div className="card border border-accent/20">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={14} className="text-accent" />
          <h2 className="text-data text-sm font-semibold">Account Balance</h2>
        </div>
        {loading ? <div className="h-8 bg-surface-2 rounded animate-pulse w-40" /> : funds ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-muted text-[10px] uppercase tracking-wider">Available Cash</p>
              <p className="text-accent text-xl font-mono font-bold mt-1">₹{availableCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-muted text-[10px] uppercase tracking-wider">Used Margin</p>
              <p className="text-loss text-xl font-mono font-bold mt-1">₹{Math.abs(parseFloat(funds.utiliseddebits || '0')).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-muted text-[10px] uppercase tracking-wider">Net Value</p>
              <p className="text-data text-xl font-mono font-bold mt-1">₹{parseFloat(funds.net || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        ) : <p className="text-muted text-xs">Connect your broker account to see funds</p>}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-warn" />
          <h2 className="text-data text-sm font-semibold">Set Trading Capital</h2>
        </div>
        <div>
          <label className="text-muted text-xs block mb-1">Capital Amount (₹)</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
              <input type="number" value={capital} onChange={e => setCapital(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-surface-2 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-data font-mono text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <button onClick={activateStrategy} disabled={saving || !capital}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">
              {saving ? <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                : saved ? <CheckCircle size={14} /> : <Zap size={14} />}
              {saving ? 'Activating...' : saved ? 'Activated!' : 'Activate Strategy'}
            </button>
          </div>
          {availableCash > 0 && capitalNum > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted">
                <span>Using {capitalPercent}% of available cash</span>
                <span>Daily loss limit: ₹{Math.round(capitalNum * 0.05).toLocaleString('en-IN')} (5%)</span>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${capitalPercent > 80 ? 'bg-loss' : capitalPercent > 50 ? 'bg-warn' : 'bg-accent'}`}
                  style={{ width: `${Math.min(capitalPercent, 100)}%` }} />
              </div>
            </div>
          )}
        </div>
        {availableCash > 0 && (
          <div className="flex gap-2 flex-wrap">
            {[25, 50, 75, 100].map(pct => (
              <button key={pct} onClick={() => setCapital(Math.floor(availableCash * pct / 100).toString())}
                className="px-3 py-1.5 rounded-lg bg-surface-2 text-muted text-xs hover:text-data transition-colors">
                {pct}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="text-data text-sm font-semibold">Strategy Status</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'NIFTY Auto-Trading', active: niftySettings?.autoTradingEnabled },
            { label: 'SENSEX Auto-Trading', active: sensexSettings?.autoTradingEnabled },
          ].map(item => (
            <div key={item.label} className={`p-3 rounded-lg border ${item.active ? 'border-accent/20 bg-accent/5' : 'border-white/10 bg-surface-2'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-accent animate-pulse' : 'bg-muted'}`} />
                <p className="text-data text-xs font-medium">{item.label}</p>
              </div>
              <p className={`text-xs mt-1 font-medium ${item.active ? 'text-accent' : 'text-muted'}`}>
                {item.active ? 'Active' : 'Inactive'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LevelsCard({ index, levels, color }: { index: string; levels: any; color: string }) {
  return (
    <div className="p-4 rounded-lg bg-surface-2 border border-white/5 space-y-3">
      <p className={`text-xs font-semibold ${color}`}>{index}</p>
      <div className="space-y-2">
        {[
          { label: 'Buy Above', value: levels.buyAbove, cls: 'text-accent' },
          { label: 'Sell Below', value: levels.sellBelow, cls: 'text-loss' },
          { label: 'Spot SL', value: levels.spotStopLoss, cls: 'text-warn' },
        ].map(row => (
          <div key={row.label} className="flex justify-between">
            <span className="text-muted text-[10px]">{row.label}</span>
            <span className={`font-mono text-xs font-semibold ${row.cls}`}>{parseFloat(row.value).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-center">
          <p className="text-[10px] text-muted">CE Strike</p>
          <p className="text-accent font-mono font-bold text-sm">{parseFloat(levels.ceStrike).toLocaleString('en-IN')}</p>
        </div>
        <div className="p-2 rounded-lg bg-loss/10 border border-loss/20 text-center">
          <p className="text-[10px] text-muted">PE Strike</p>
          <p className="text-loss font-mono font-bold text-sm">{parseFloat(levels.peStrike).toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  )
}

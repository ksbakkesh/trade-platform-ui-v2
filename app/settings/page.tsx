'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getAccountId() {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem('tp_broker') || '1')
}

interface Settings {
  id: number
  indexName: string
  premiumThreshold: number
  candleTimeframeMinutes: number
  rsiThreshold: number
  volumeMultiplier: number
  deltaMin: number
  deltaMax: number
  stopLossPoints: number
  target1Points: number
  target2Points: number
  exitStrategyMode: string
  reEntryEnabled: boolean
  quantityMode: string
  capitalAllocationPercent: number | null
  fixedLots: number | null
  autoTradingEnabled: boolean
}

const DEFAULT: Partial<Settings> = {
  premiumThreshold: 125,
  candleTimeframeMinutes: 15,
  rsiThreshold: 60,
  volumeMultiplier: 2,
  deltaMin: 0.45,
  deltaMax: 0.65,
  stopLossPoints: 100,
  target1Points: 160,
  target2Points: 200,
  exitStrategyMode: 'OPTION1',
  reEntryEnabled: true,
  quantityMode: 'CAPITAL_BASED',
  capitalAllocationPercent: 20,
  autoTradingEnabled: true,
}

export default function StrategySettingsPage() {
  const [activeTab, setActiveTab] = useState<'NIFTY' | 'SENSEX'>('NIFTY')
  const [nifty, setNifty] = useState<Settings | null>(null)
  const [sensex, setSensex] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const current = activeTab === 'NIFTY' ? nifty : sensex
  const setCurrent = activeTab === 'NIFTY' ? setNifty : setSensex

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const accountId = getAccountId()
      const [n, s] = await Promise.all([
        fetch(`${API}/api/admin/strategy-settings/account/${accountId}/index/NIFTY`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/api/admin/strategy-settings/account/${accountId}/index/SENSEX`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null),
      ])
      setNifty(n)
      setSensex(s)
    } catch (e) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  const handleSave = async () => {
    if (!current) return
    setError(''); setSuccess(''); setSaving(true)
    try {
      const payload = {
        brokerAccountId: getAccountId(),
        indexName: current.indexName,
        openPriceMode: 'AUTO',
        premiumThreshold: current.premiumThreshold,
        candleTimeframeMinutes: current.candleTimeframeMinutes,
        rsiThreshold: current.rsiThreshold,
        volumeMultiplier: current.volumeMultiplier,
        deltaMin: current.deltaMin,
        deltaMax: current.deltaMax,
        stopLossPoints: current.stopLossPoints,
        target1Points: current.target1Points,
        target2Points: current.target2Points,
        exitStrategyMode: current.exitStrategyMode,
        reEntryEnabled: current.reEntryEnabled,
        quantityMode: current.quantityMode,
        capitalAllocationPercent: current.capitalAllocationPercent,
        fixedLots: current.fixedLots,
        autoTradingEnabled: current.autoTradingEnabled,
      }
      const res = await fetch(`${API}/api/admin/strategy-settings/${current.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setSuccess(`✓ ${activeTab} settings saved successfully`)
      fetchSettings()
    } catch (e: any) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  const update = (field: keyof Settings, value: any) => {
    setCurrent(prev => prev ? { ...prev, [field]: value } : prev)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 pb-6 max-w-3xl">
      <div>
        <h1 className="text-data text-base font-semibold">Strategy Settings</h1>
        <p className="text-muted text-xs mt-0.5">Configure trading parameters for NIFTY and SENSEX</p>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
          <CheckCircle size={14} className="text-accent" />
          <p className="text-accent text-xs">{success}</p>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-loss/10 border border-loss/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-loss" />
          <p className="text-loss text-xs">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['NIFTY', 'SENSEX'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSuccess(''); setError('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-accent text-bg'
                : 'bg-surface-2 text-muted hover:text-data'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {current ? (
        <div className="space-y-4">

          {/* Auto Trading */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-data text-sm font-semibold">{activeTab} Auto Trading</h3>
                <p className="text-muted text-xs mt-0.5">Enable or disable automated trading for {activeTab}</p>
              </div>
              <button
                onClick={() => update('autoTradingEnabled', !current.autoTradingEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${current.autoTradingEnabled ? 'bg-accent' : 'bg-surface-2'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${current.autoTradingEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Entry Conditions */}
          <div className="card space-y-4">
            <h3 className="text-data text-sm font-semibold">Entry Conditions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Premium Threshold (₹)" hint="Min option premium to trade"
                value={current.premiumThreshold}
                onChange={v => update('premiumThreshold', v)} />
              <Field label="RSI Threshold" hint="Min RSI value for signal"
                value={current.rsiThreshold}
                onChange={v => update('rsiThreshold', v)} />
              <Field label="Volume Multiplier" hint="Current candle must be Nx previous"
                value={current.volumeMultiplier} step={0.1}
                onChange={v => update('volumeMultiplier', v)} />
              <Field label="Candle Timeframe (min)" hint="15 = 15 minute candles"
                value={current.candleTimeframeMinutes}
                onChange={v => update('candleTimeframeMinutes', v)} />
              <Field label="Delta Min" hint="Min option delta" step={0.01}
                value={current.deltaMin}
                onChange={v => update('deltaMin', v)} />
              <Field label="Delta Max" hint="Max option delta" step={0.01}
                value={current.deltaMax}
                onChange={v => update('deltaMax', v)} />
            </div>
          </div>

          {/* Exit Parameters */}
          <div className="card space-y-4">
            <h3 className="text-data text-sm font-semibold">Exit Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Stop Loss (points)" hint="SL below entry"
                value={current.stopLossPoints}
                onChange={v => update('stopLossPoints', v)} />
              <Field label="Target 1 (points)" hint="First target above entry"
                value={current.target1Points}
                onChange={v => update('target1Points', v)} />
              <Field label="Target 2 (points)" hint="Second target above entry"
                value={current.target2Points}
                onChange={v => update('target2Points', v)} />
            </div>

            {/* Exit Strategy */}
            <div>
              <label className="text-muted text-xs block mb-2">Exit Strategy</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'OPTION1', label: 'Option 1', desc: '50% exit at T1 → SL to cost → 50% at T2' },
                  { value: 'OPTION2', label: 'Option 2', desc: '100% exit at T1' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => update('exitStrategyMode', opt.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      current.exitStrategyMode === opt.value
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-white/10 bg-surface-2 hover:border-white/20'
                    }`}>
                    <p className={`text-sm font-medium ${current.exitStrategyMode === opt.value ? 'text-accent' : 'text-data'}`}>
                      {opt.label}
                    </p>
                    <p className="text-muted text-xs mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Re-entry */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
              <div>
                <p className="text-data text-xs font-medium">Re-entry after Stop Loss</p>
                <p className="text-muted text-[10px] mt-0.5">Allow re-entry if conditions are still valid after SL hit</p>
              </div>
              <button onClick={() => update('reEntryEnabled', !current.reEntryEnabled)}
                className={`relative w-9 h-5 rounded-full transition-colors ${current.reEntryEnabled ? 'bg-accent' : 'bg-surface-2 border border-white/20'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${current.reEntryEnabled ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          </div>

          {/* Position Sizing */}
          <div className="card space-y-4">
            <h3 className="text-data text-sm font-semibold">Position Sizing</h3>
            <div>
              <label className="text-muted text-xs block mb-2">Quantity Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'CAPITAL_BASED', label: 'Capital Based', desc: '% of available capital' },
                  { value: 'FIXED_LOTS', label: 'Fixed Lots', desc: 'Fixed number of lots' },
                  { value: 'FIXED_QUANTITY', label: 'Fixed Qty', desc: 'Fixed number of units' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => update('quantityMode', opt.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      current.quantityMode === opt.value
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-white/10 bg-surface-2 hover:border-white/20'
                    }`}>
                    <p className={`text-xs font-medium ${current.quantityMode === opt.value ? 'text-accent' : 'text-data'}`}>
                      {opt.label}
                    </p>
                    <p className="text-muted text-[10px] mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {current.quantityMode === 'CAPITAL_BASED' && (
              <Field label="Capital Allocation (%)" hint="% of available capital to use per trade"
                value={current.capitalAllocationPercent ?? 20} step={1}
                onChange={v => update('capitalAllocationPercent', v)} />
            )}
            {current.quantityMode === 'FIXED_LOTS' && (
              <Field label="Fixed Lots" hint="Number of lots per trade"
                value={current.fixedLots ?? 1} step={1}
                onChange={v => update('fixedLots', v)} />
            )}
          </div>

          {/* Save Button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving
              ? <><span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />Saving...</>
              : <><Save size={14} />Save {activeTab} Settings</>
            }
          </button>
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-muted text-sm">No {activeTab} settings found.</p>
          <p className="text-muted text-xs mt-1">Connect your broker account first.</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, value, onChange, step = 1 }: {
  label: string; hint: string; value: number | null; onChange: (v: number) => void; step?: number
}) {
  return (
    <div>
      <label className="text-muted text-xs block mb-1">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-data font-mono text-sm focus:outline-none focus:border-accent/50"
      />
      <p className="text-muted text-[10px] mt-0.5">{hint}</p>
    </div>
  )
}

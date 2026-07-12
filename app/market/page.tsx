'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Quote {
  ltp: number
  open: number
  high: number
  low: number
  close: number
  tradeVolume: number
  symbolName: string
}

export default function MarketOverviewPage() {
  const [nifty, setNifty] = useState<Quote | null>(null)
  const [sensex, setSensex] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [nRes, sRes] = await Promise.all([
        fetch(`${API}/test/angelone/quote?exchange=NSE&token=99926000&mode=FULL`, { headers: getAuthHeaders() }),
        fetch(`${API}/test/angelone/quote?exchange=BSE&token=1&mode=FULL`, { headers: getAuthHeaders() }),
      ])
      if (nRes.ok) {
        const d = await nRes.json()
        if (d.fetched?.[0]) setNifty(d.fetched[0])
      }
      if (sRes.ok) {
        const d = await sRes.json()
        if (d.fetched?.[0]) setSensex(d.fetched[0])
      }
      setLastUpdated(new Date().toLocaleTimeString('en-IN'))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const change = (q: Quote) => q.ltp - q.close
  const changePct = (q: Quote) => ((q.ltp - q.close) / q.close * 100)

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Market Overview</h1>
          <p className="text-muted text-xs mt-0.5">
            Live NIFTY 50 & SENSEX data{lastUpdated && ` · Updated ${lastUpdated}`}
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{background:'#10b981', color:'#0a0e1a'}}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {/* Index cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'NIFTY 50', data: nifty, color: '#60a5fa' },
          { label: 'SENSEX', data: sensex, color: '#a78bfa' },
        ].map(({ label, data, color }) => (
          <div key={label} className="card border" style={{borderColor: `${color}20`}}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:`${color}15`, color}}>
                {label}
              </span>
              {data && (
                <div className="flex items-center gap-1">
                  {change(data) >= 0
                    ? <TrendingUp size={14} style={{color:'#10b981'}} />
                    : <TrendingDown size={14} style={{color:'#ef4444'}} />
                  }
                  <span className="text-xs font-semibold" style={{color: change(data) >= 0 ? '#10b981' : '#ef4444'}}>
                    {change(data) >= 0 ? '+' : ''}{change(data).toFixed(2)} ({changePct(data).toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>

            {data ? (
              <>
                <p className="text-3xl font-mono font-bold text-data mb-4">
                  {data.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Open', value: data.open?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
                    { label: 'Prev Close', value: data.close?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
                    { label: 'High', value: data.high?.toLocaleString('en-IN', { minimumFractionDigits: 2 }), cls: 'text-accent' },
                    { label: 'Low', value: data.low?.toLocaleString('en-IN', { minimumFractionDigits: 2 }), cls: 'text-loss' },
                  ].map(item => (
                    <div key={item.label} className="p-2 rounded-lg" style={{background:'#1f2937'}}>
                      <p className="text-muted text-[10px]">{item.label}</p>
                      <p className={`font-mono text-sm font-semibold mt-0.5 ${item.cls || 'text-data'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 rounded-lg" style={{background:'#1f2937'}}>
                  <p className="text-muted text-[10px]">Volume</p>
                  <p className="text-data font-mono text-sm font-semibold mt-0.5">
                    {data.tradeVolume?.toLocaleString('en-IN')}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                {loading
                  ? <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  : <p className="text-muted text-sm">No data available</p>
                }
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Market timing */}
      <div className="card space-y-2">
        <h3 className="text-data text-sm font-semibold flex items-center gap-2">
          <Activity size={14} className="text-accent" />Market Timings (IST)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Pre-Open', value: '9:00 - 9:15 AM' },
            { label: 'Market Open', value: '9:15 AM' },
            { label: 'Market Close', value: '3:30 PM' },
            { label: 'Trading Days', value: 'Mon - Fri' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-lg" style={{background:'#1f2937'}}>
              <p className="text-muted text-[10px]">{item.label}</p>
              <p className="text-data text-xs font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expiry info */}
      <div className="card space-y-2">
        <h3 className="text-data text-sm font-semibold">Weekly Expiry</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border" style={{background:'rgba(96,165,250,0.05)', borderColor:'rgba(96,165,250,0.2)'}}>
            <p className="text-xs font-semibold" style={{color:'#60a5fa'}}>NIFTY 50</p>
            <p className="text-data text-sm font-bold mt-1">Every Tuesday</p>
            <p className="text-muted text-[10px] mt-0.5">Weekly options expiry</p>
          </div>
          <div className="p-3 rounded-lg border" style={{background:'rgba(167,139,250,0.05)', borderColor:'rgba(167,139,250,0.2)'}}>
            <p className="text-xs font-semibold" style={{color:'#a78bfa'}}>SENSEX</p>
            <p className="text-data text-sm font-bold mt-1">Every Thursday</p>
            <p className="text-muted text-[10px] mt-0.5">Weekly options expiry</p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Position {
  tradingsymbol: string
  symbolname: string
  optiontype: string
  strikeprice: string
  expirydate: string
  exchange: string
  buyqty: string
  sellqty: string
  netqty: string
  ltp: string
  pnl: string
  realised: string
  unrealised: string
  buyavgprice: string
  sellavgprice: string
  lotsize: string
  producttype: string
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchPositions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/dashboard/live-positions`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPositions(Array.isArray(data) ? data : [])
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPositions() }, [])

  const totalPnl = positions.reduce((sum, p) => sum + parseFloat(p.pnl || '0'), 0)
  const totalUnrealised = positions.reduce((sum, p) => sum + parseFloat(p.unrealised || '0'), 0)
  const openPositions = positions.filter(p => parseFloat(p.netqty) !== 0)

  const fmt = (val: string | number) =>
    parseFloat(String(val)).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Live Positions</h1>
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

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Total Positions</p>
          <p className="text-data text-2xl font-mono font-bold mt-1">{positions.length}</p>
          <p className="text-muted text-[10px] mt-0.5">{openPositions.length} open</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Realised P&L</p>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalPnl >= 0 ? 'text-accent' : 'text-loss'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{fmt(totalPnl)}
          </p>
          <p className="text-muted text-[10px] mt-0.5">today</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-[10px] uppercase tracking-wider">Unrealised P&L</p>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalUnrealised >= 0 ? 'text-accent' : 'text-loss'}`}>
            {totalUnrealised >= 0 ? '+' : ''}₹{fmt(totalUnrealised)}
          </p>
          <p className="text-muted text-[10px] mt-0.5">open positions</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : positions.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp size={32} className="text-muted mx-auto mb-3 opacity-50" />
          <p className="text-muted text-sm">No positions today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((pos, i) => {
            const pnl = parseFloat(pos.pnl || '0')
            const pnlPositive = pnl >= 0
            const netQty = parseFloat(pos.netqty || '0')
            return (
              <div key={i} className={`card border ${pnlPositive ? 'border-accent/20' : 'border-loss/20'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${netQty !== 0 ? 'animate-pulse bg-accent' : 'bg-muted'}`} />
                    <span className="text-data font-mono font-semibold text-sm">{pos.tradingsymbol}</span>
                    <span className={`badge ${pos.optiontype === 'CE' ? 'badge-green' : 'badge-amber'}`}>{pos.optiontype}</span>
                    <span className="badge badge-green">{pos.producttype}</span>
                  </div>
                  <span className="text-muted text-[10px]">{pos.expirydate}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox label="LTP" value={`₹${fmt(pos.ltp)}`} />
                  <StatBox label="Net Qty" value={pos.netqty} cls={netQty > 0 ? 'text-accent' : netQty < 0 ? 'text-loss' : 'text-muted'} />
                  <StatBox label="Realised P&L" value={`${pnlPositive ? '+' : ''}₹${fmt(pos.pnl)}`} cls={pnlPositive ? 'text-accent' : 'text-loss'} />
                  <StatBox label="Unrealised P&L" value={`₹${fmt(pos.unrealised)}`} cls={parseFloat(pos.unrealised) >= 0 ? 'text-accent' : 'text-loss'} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <StatBox label="Buy Avg" value={`₹${fmt(pos.buyavgprice)}`} />
                  <StatBox label="Sell Avg" value={`₹${fmt(pos.sellavgprice)}`} />
                  <StatBox label="Buy Qty" value={pos.buyqty} />
                  <StatBox label="Sell Qty" value={pos.sellqty} />
                </div>
              </div>
            )
          })}
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

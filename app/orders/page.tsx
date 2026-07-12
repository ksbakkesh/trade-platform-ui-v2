'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth'
import { RefreshCw, ClipboardList, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface Order {
  orderid: string
  tradingsymbol: string
  transactiontype: string
  quantity: string
  price: string
  averageprice: string
  status: string
  orderstatus: string
  exchange: string
  producttype: string
  ordertype: string
  variety: string
  strikeprice?: string
  optiontype?: string
  expirydate?: string
  updatetime: string
  exchtime: string
  text?: string
}

const STATUS_CONFIG: Record<string, { cls: string; icon: any; label: string }> = {
  'complete':      { cls: 'text-accent', icon: CheckCircle, label: 'Executed' },
  'rejected':      { cls: 'text-loss', icon: XCircle, label: 'Rejected' },
  'cancelled':     { cls: 'text-muted', icon: XCircle, label: 'Cancelled' },
  'open':          { cls: 'text-warn', icon: Clock, label: 'Open' },
  'pending':       { cls: 'text-warn', icon: Clock, label: 'Pending' },
  'trigger pending': { cls: 'text-warn', icon: Clock, label: 'Trigger Pending' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'EXECUTED' | 'PENDING' | 'REJECTED'>('ALL')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/test/angelone/orders`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
        setLastUpdated(new Date().toLocaleTimeString('en-IN'))
      } else {
        setError('Failed to fetch orders from Angel One')
      }
    } catch { setError('Could not connect to Angel One') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const filtered = orders.filter(o => {
    const s = (o.status || o.orderstatus || '').toLowerCase()
    if (filter === 'ALL') return true
    if (filter === 'EXECUTED') return s === 'complete'
    if (filter === 'PENDING') return s === 'open' || s === 'pending' || s === 'trigger pending'
    if (filter === 'REJECTED') return s === 'rejected' || s === 'cancelled'
    return true
  })

  const executedCount = orders.filter(o => (o.status || o.orderstatus || '').toLowerCase() === 'complete').length
  const pendingCount = orders.filter(o => ['open', 'pending', 'trigger pending'].includes((o.status || o.orderstatus || '').toLowerCase())).length
  const rejectedCount = orders.filter(o => ['rejected', 'cancelled'].includes((o.status || o.orderstatus || '').toLowerCase())).length

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-data text-base font-semibold">Orders</h1>
          <p className="text-muted text-xs mt-0.5">
            Today's Angel One order book{lastUpdated && ` · Updated ${lastUpdated}`}
          </p>
        </div>
        <button onClick={fetchOrders} disabled={loading}
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: orders.length, cls: 'text-data' },
          { label: 'Executed', value: executedCount, cls: 'text-accent' },
          { label: 'Pending', value: pendingCount, cls: 'text-warn' },
          { label: 'Rejected', value: rejectedCount, cls: 'text-loss' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-muted text-[10px] uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-mono font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['ALL', 'EXECUTED', 'PENDING', 'REJECTED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-accent/20 text-accent' : 'text-muted hover:text-data hover:bg-surface-2'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList size={32} className="text-muted mx-auto mb-3 opacity-50" />
          <p className="text-muted text-sm">No orders today</p>
          <p className="text-muted text-xs mt-1">Orders appear here when placed at 9:15 AM</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const statusKey = (order.status || order.orderstatus || '').toLowerCase()
            const statusCfg = STATUS_CONFIG[statusKey] || { cls: 'text-muted', icon: Clock, label: statusKey }
            const isBuy = order.transactiontype === 'BUY'
            const Icon = statusCfg.icon
            return (
              <div key={order.orderid} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon size={14} className={statusCfg.cls} />
                    <span className="text-data font-mono font-semibold text-sm">{order.tradingsymbol}</span>
                    <span className={`badge ${isBuy ? 'badge-green' : 'badge-red'}`}>{order.transactiontype}</span>
                    <span className={`badge ${statusCfg.cls.replace('text-', 'badge-').replace('accent', 'green').replace('loss', 'red').replace('warn', 'amber').replace('muted', 'muted')}`}>
                      {statusCfg.label}
                    </span>
                    <span className="badge badge-muted">{order.exchange}</span>
                  </div>
                  <span className="text-muted text-[10px] font-mono shrink-0">#{order.orderid?.slice(-6)}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Qty', value: order.quantity },
                    { label: 'Order Price', value: order.price === '0' ? 'Market' : `₹${order.price}` },
                    { label: 'Avg Price', value: order.averageprice !== '0' ? `₹${order.averageprice}` : '—' },
                    { label: 'Product', value: order.producttype },
                  ].map(item => (
                    <div key={item.label} className="p-2 rounded-lg bg-surface-2">
                      <p className="text-muted text-[10px]">{item.label}</p>
                      <p className="text-data font-mono text-xs font-semibold mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                  <span className="text-muted font-mono">{order.updatetime || order.exchtime}</span>
                  {order.text && <span className="text-loss text-[10px]">{order.text}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

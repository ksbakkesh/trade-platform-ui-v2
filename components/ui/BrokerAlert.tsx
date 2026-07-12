'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, Plug } from 'lucide-react'
import { getAuthHeaders, useAuth } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function BrokerAlert() {
  const { user, permissions } = useAuth()
  const [hasbroker, setHasBroker] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    const brokerId = localStorage.getItem('tp_broker')
    if (brokerId) { setHasBroker(true); return }

    fetch(`${API}/broker/my-account`, { headers: getAuthHeaders() })
      .then(r => {
        if (r.ok) { setHasBroker(true) }
        else if (r.status === 404) { setHasBroker(false) }
      })
      .catch(() => setHasBroker(false))
  }, [user])

  if (hasbroker === null || hasbroker === true) return null

  return (
    <div className="rounded-xl border p-4 flex items-start gap-3 mb-4"
      style={{background:'rgba(245,158,11,0.08)', borderColor:'rgba(245,158,11,0.25)'}}>
      <AlertTriangle size={18} style={{color:'#f59e0b', flexShrink: 0, marginTop: 1}} />
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{color:'#f59e0b'}}>
          Broker Account Not Connected
        </p>
        <p className="text-xs mt-1" style={{color:'#9ca3af'}}>
          Your Angel One account is not connected yet. Auto-trading will not work until your broker is set up.
          {permissions.brokerSetup
            ? ' Please go to Broker Setup to connect your account.'
            : ' Please contact your administrator to connect your broker account.'}
        </p>
      </div>
      {permissions.brokerSetup && (
        <a href="/broker"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          style={{background:'rgba(245,158,11,0.15)', color:'#f59e0b'}}>
          <Plug size={12} />Setup
        </a>
      )}
    </div>
  )
}

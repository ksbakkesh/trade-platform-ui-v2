'use client'
import { useState, useEffect } from 'react'
import { getAuthHeaders, useAuth } from '@/lib/auth'
import { saveBrokerAccountId } from '@/lib/api'
import { CheckCircle, AlertCircle, Eye, EyeOff, ExternalLink, ArrowRight, ArrowLeft, Plug } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const STEPS = [
  {
    step: 1,
    title: 'Open SmartAPI Portal',
    description: 'Click the button below to open Angel One SmartAPI website in a new tab.',
    instruction: 'Login with your normal Angel One mobile number and password.',
    action: 'Open SmartAPI Portal',
    link: 'https://smartapi.angelone.in',
    image: '🌐',
    tip: 'Use the same mobile number and password you use for the Angel One app.',
  },
  {
    step: 2,
    title: 'Create a New App',
    description: 'After logging in, you will see a dashboard. Follow these steps:',
    bullets: [
      'Click "My Apps" in the top menu',
      'Click "Create App" button',
      'Enter any name (e.g. "MyTrader")',
      'Select "Trading" as the app type',
      'Click Submit',
    ],
    image: '📱',
    tip: 'The app name can be anything — it\'s just a label.',
  },
  {
    step: 3,
    title: 'Copy Your API Key',
    description: 'After creating the app, you will see your API Key. Copy it.',
    bullets: [
      'Click on your newly created app',
      'You will see "API Key" — a long string of letters and numbers',
      'Click the copy button next to it',
      'Paste it in the field below',
    ],
    image: '🔑',
    tip: 'The API Key looks like: abc123def456xyz — keep it safe, don\'t share with anyone.',
    field: { key: 'apiKey', label: 'Paste API Key here', placeholder: 'e.g. abc123def456xyz789' },
  },
  {
    step: 4,
    title: 'Enable TOTP (Auto Login)',
    description: 'This lets our app login automatically every morning at 9 AM without you doing anything.',
    bullets: [
      'In the SmartAPI portal, click your profile icon (top right)',
      'Click "Enable TOTP"',
      'You will see a QR code and a SECRET KEY below it',
      'Copy only the SECRET KEY (not the QR code)',
      'Paste it in the field below',
    ],
    image: '🔐',
    tip: 'The Secret Key looks like: JBSWY3DPEHPK3PXP — this is what we need, not the QR code.',
    field: { key: 'totpSecret', label: 'Paste TOTP Secret Key here', placeholder: 'e.g. JBSWY3DPEHPK3PXP' },
  },
  {
    step: 5,
    title: 'Enter Your Login Details',
    description: 'Finally, enter your Angel One login credentials so we can connect.',
    image: '✅',
    tip: 'These are stored encrypted — nobody can read them, not even us.',
    finalFields: true,
  },
]

export default function BrokerSetupPage() {
  const [connected, setConnected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0) // 0 = landing, 1-5 = steps
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const [form, setForm] = useState({
    clientCode: '', apiKey: '', password: '', totpSecret: ''
  })

  const fetchConnected = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/broker/my-account`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setConnected(data)
        saveBrokerAccountId(data.id) // save for API calls
      }
      else setConnected(null)
    } catch { setConnected(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchConnected() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const res = await fetch(`${API}/api/broker/connect/angel-one`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to connect')
      setSuccess('✓ Angel One connected successfully!')
      setCurrentStep(0)
      fetchConnected()
    } catch (err: any) {
      setError(err.message)
    } finally { setSaving(false) }
  }

  const handleTest = async () => {
    setError(''); setTesting(true)
    try {
      const res = await fetch(`${API}/api/broker/test-connection`, {
        method: 'POST', headers: getAuthHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test failed')
      setSuccess('✓ Connection successful! Angel One is working perfectly.')
    } catch (err: any) {
      setError(err.message)
    } finally { setTesting(false) }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Angel One? Auto-trading will stop.')) return
    await fetch(`${API}/api/broker/disconnect`, { method: 'DELETE', headers: getAuthHeaders() })
    setConnected(null)
    setSuccess('Broker disconnected.')
  }

  const step = STEPS[currentStep - 1]

  // ── Connected State ──
  if (connected && currentStep === 0) {
    return (
      <div className="space-y-4 pb-6 max-w-2xl">
        <div>
          <h1 className="text-data text-base font-semibold">Broker Setup</h1>
          <p className="text-muted text-xs mt-0.5">Manage your broker connection</p>
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

        {/* Connected card */}
        <div className="card border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">🔶</div>
            <div>
              <p className="text-data font-semibold">Angel One</p>
              <p className="text-muted text-xs">SmartAPI</p>
            </div>
            <span className="ml-auto badge badge-green">● Connected</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-surface-2">
              <p className="text-muted text-[10px]">Client Code</p>
              <p className="text-data font-mono text-sm mt-0.5">{connected.clientCode}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-2">
              <p className="text-muted text-[10px]">Connected Since</p>
              <p className="text-data font-mono text-sm mt-0.5">
                {new Date(connected.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleTest} disabled={testing}
              className="flex-1 py-2.5 rounded-lg bg-surface-2 text-data text-xs font-medium hover:bg-surface transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {testing ? <span className="w-3 h-3 border-2 border-data/30 border-t-data rounded-full animate-spin" /> : <Plug size={13} />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-lg bg-surface-2 text-muted text-xs hover:text-data transition-colors">
              Update
            </button>
            <button onClick={handleDisconnect}
              className="px-4 py-2 rounded-lg bg-loss/10 text-loss text-xs hover:bg-loss/20 transition-colors">
              Disconnect
            </button>
          </div>
        </div>

        {/* Other brokers */}
        <h2 className="text-data text-xs font-semibold mt-2">Other Brokers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'Zerodha', logo: '🔵', color: 'border-blue-500/20', when: 'Q3 2026' },
            { name: 'Upstox', logo: '🟣', color: 'border-purple-500/20', when: 'Q3 2026' },
            { name: 'Dhan', logo: '🟢', color: 'border-green-500/20', when: 'Q4 2026' },
          ].map(b => (
            <div key={b.name} className={`card border ${b.color} opacity-60`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{b.logo}</span>
                <p className="text-data text-sm font-medium">{b.name}</p>
              </div>
              <span className="badge badge-muted text-[10px]">Coming {b.when}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Landing Page ──
  if (currentStep === 0) {
    return (
      <div className="space-y-4 pb-6 max-w-2xl">
        <div>
          <h1 className="text-data text-base font-semibold">Broker Setup</h1>
          <p className="text-muted text-xs mt-0.5">Connect your broker to start auto-trading</p>
        </div>

        {success && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
            <CheckCircle size={14} className="text-accent" />
            <p className="text-accent text-xs">{success}</p>
          </div>
        )}

        {/* Angel One */}
        <div className="card border border-orange-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">🔶</div>
            <div>
              <p className="text-data font-semibold">Angel One</p>
              <p className="text-muted text-xs">SmartAPI — Free, Full NSE/BSE support</p>
            </div>
            <span className="ml-auto badge badge-green text-[10px]">Available</span>
          </div>
          <p className="text-muted text-xs mb-4 leading-relaxed">
            Connect your Angel One account. We will guide you step by step — takes only 5 minutes.
            You only need to do this once.
          </p>
          <button onClick={() => setCurrentStep(1)}
            className="w-full py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
            Connect Angel One
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Coming Soon brokers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'Zerodha', logo: '🔵', api: 'Kite Connect', color: 'border-blue-500/20', when: 'Q3 2026' },
            { name: 'Upstox', logo: '🟣', api: 'Upstox v3', color: 'border-purple-500/20', when: 'Q3 2026' },
            { name: 'Dhan', logo: '🟢', api: 'DhanHQ API', color: 'border-green-500/20', when: 'Q4 2026' },
          ].map(b => (
            <div key={b.name} className={`card border ${b.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{b.logo}</span>
                <div>
                  <p className="text-data text-sm font-medium">{b.name}</p>
                  <p className="text-muted text-[10px]">{b.api}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="badge badge-muted text-[10px]">Coming Soon</span>
                <span className="text-muted text-[10px]">{b.when}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Step-by-step guide ──
  return (
    <div className="space-y-4 pb-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setCurrentStep(currentStep - 1); setError('') }}
          className="p-2 rounded-lg bg-surface-2 text-muted hover:text-data transition-colors">
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 className="text-data text-base font-semibold">Connect Angel One</h1>
          <p className="text-muted text-xs">Step {currentStep} of {STEPS.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-loss/10 border border-loss/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-loss shrink-0" />
          <p className="text-loss text-xs">{error}</p>
        </div>
      )}

      {/* Step card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">
            {step.image}
          </div>
          <div>
            <p className="text-muted text-[10px] font-mono uppercase">Step {step.step}</p>
            <p className="text-data text-sm font-semibold">{step.title}</p>
          </div>
        </div>

        <p className="text-muted text-sm mb-3 leading-relaxed">{step.description}</p>

        {/* Bullet steps */}
        {step.bullets && (
          <div className="space-y-2 mb-4">
            {step.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-data text-xs leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        )}

        {/* Open link button */}
        {step.link && (
          <a href={step.link} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors mb-4">
            {step.action}
            <ExternalLink size={13} />
          </a>
        )}

        {/* Single field (API Key or TOTP) */}
        {step.field && (
          <div className="mb-4">
            <label className="text-muted text-xs block mb-1">{step.field.label}</label>
            <input
              type="text"
              value={form[step.field.key as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [step.field!.key]: e.target.value }))}
              placeholder={step.field.placeholder}
              className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data font-mono text-sm focus:outline-none focus:border-accent/50"
            />
          </div>
        )}

        {/* Final fields */}
        {step.finalFields && (
          <form onSubmit={handleSave} className="space-y-3 mb-4">
            <div>
              <label className="text-muted text-xs block mb-1">Client Code</label>
              <input type="text" value={form.clientCode}
                onChange={e => setForm(prev => ({ ...prev, clientCode: e.target.value }))}
                placeholder="e.g. AAAL701361" required
                autoComplete="off"
                name="clientCode"
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-data font-mono text-sm focus:outline-none focus:border-accent/50" />
              <p className="text-muted text-[10px] mt-1">Your Angel One login ID (e.g. AAAL701361)</p>
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Your Angel One password" required
                  autoComplete="new-password"
                  name="angelPassword"
                  className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-data text-sm focus:outline-none focus:border-accent/50" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-data">
                  {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="text-muted text-[10px] mt-1">Same password you use for Angel One app</p>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-3 h-3 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />Connecting...</>
                : <>Connect Angel One <CheckCircle size={14} /></>
              }
            </button>
          </form>
        )}

        {/* Tip box */}
        <div className="p-3 rounded-lg bg-surface-2 border border-white/5">
          <p className="text-muted text-xs">
            <span className="text-warn">💡 Tip: </span>{step.tip}
          </p>
        </div>
      </div>

      {/* Next button (non-final steps) */}
      {!step.finalFields && (
        <button
          onClick={() => {
            if (step.field && !form[step.field.key as keyof typeof form]) {
              setError(`Please paste your ${step.field.label} before continuing.`)
              return
            }
            setError('')
            setCurrentStep(currentStep + 1)
          }}
          className="w-full py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
        >
          {step.link ? 'I have opened the portal, next' : 'Next'}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}

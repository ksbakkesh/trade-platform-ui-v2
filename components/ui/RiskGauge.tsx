'use client'

interface Props { used: number; limit: number; isCount?: boolean }

export default function RiskGauge({ used, limit, isCount }: Props) {
  const pct = Math.min(limit > 0 ? used / limit : 0, 1)
  const r = 42, cx = 55, cy = 55
  const start = Math.PI * 0.75
  const sweep = Math.PI * 1.5
  const toXY = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  const p1 = toXY(start)
  const p2 = toXY(start + sweep)
  const p3 = toXY(start + sweep * pct)
  const trackPath = `M ${p1.x} ${p1.y} A ${r} ${r} 0 1 1 ${p2.x} ${p2.y}`
  const fillPath = pct === 0 ? '' : `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${p3.x} ${p3.y}`
  const color = pct >= 1 ? '#FF4D4D' : pct >= 0.7 ? '#F5A623' : '#00D4AA'
  return (
    <svg width="110" height="90" viewBox="0 0 110 90">
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
      {fillPath && (
        <path d={fillPath} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
      )}
      <text x={cx} y={cy + 3} textAnchor="middle" fill={color} fontSize="16"
        fontFamily="JetBrains Mono, monospace" fontWeight="600">
        {isCount ? `${used}/${limit}` : `${Math.round(pct * 100)}%`}
      </text>
    </svg>
  )
}

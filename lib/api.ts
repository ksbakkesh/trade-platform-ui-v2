import { getAuthHeaders, getAccountId } from './auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: 'no-store',
    headers: { ...getAuthHeaders() }
  })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

export interface RiskSummary {
  tradingAllowed: boolean
  reason: string
  tradesUsedToday: number
  maxTradesPerDay: number
  remainingTrades: number
  lossUsedToday: number
  dailyLossLimit: number
  remainingLossBudget: number
}

export interface Trade {
  id: number
  indexName: string
  tradingSymbol: string
  quantity: number
  entryPrice: number
  stopLossPrice: number
  target1Price: number
  target2Price: number
  exitPrice: number | null
  status: string
  exitReason: string | null
  realizedPnl: number | null
  entryTime: string
  exitTime: string | null
}

export interface Position {
  positionId: number
  tradeId: number
  tradingSymbol: string
  quantityRemaining: number
  currentLtp: number | null
  currentStopLoss: number
  unrealizedPnl: number | null
  slMovedToCost: boolean
  lastUpdatedAt: string
}

export interface GannLevels {
  indexName: string
  openPrice: number
  buyAbove: number
  sellBelow: number
  ceStrike: number
  peStrike: number
  spotStopLoss: number
}

export interface StrategySettings {
  id: number
  indexName: string
  autoTradingEnabled: boolean
  stopLossPoints: number
  target1Points: number
  target2Points: number
}

export const api = {
  riskSummary: () => get<RiskSummary>(`/api/dashboard/risk/summary?accountId=${getAccountId()}`),
  todayTrades: () => get<Trade[]>(`/api/dashboard/trades/today?accountId=${getAccountId()}`),
  positions:   () => get<Position[]>(`/api/dashboard/positions?accountId=${getAccountId()}`),
  gannLevels:  (index: string, openPrice: number) =>
    get<GannLevels>(`/api/dashboard/market/levels?accountId=${getAccountId()}&index=${index}&liveOpenPrice=${openPrice}`),
  strategySettings: (index: string) =>
    get<StrategySettings>(`/api/admin/strategy-settings/account/${getAccountId()}/index/${index}`),
  toggleAutoTrading: (settingsId: number, enabled: boolean) =>
    patch<StrategySettings>(`/api/admin/strategy-settings/${settingsId}/auto-trading?enabled=${enabled}`),
}

export function saveBrokerAccountId(id: number) {
  localStorage.setItem('tp_broker', String(id))
}

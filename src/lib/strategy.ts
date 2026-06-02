import { Bar } from './alpaca'

export interface Signal {
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  reason: string
  price: number
  stopLoss: number
  takeProfit: number
  confidence: number // 0-1
}

export interface OrbResult {
  orHigh: number
  orLow: number
  orRange: number
  vwap: number
  currentPrice: number
  volumeAvg: number
  currentVolume: number
}

export function computeVWAP(bars: Bar[]): number {
  let cumTPV = 0
  let cumVol = 0
  for (const b of bars) {
    const tp = (b.h + b.l + b.c) / 3
    cumTPV += tp * b.v
    cumVol += b.v
  }
  return cumVol > 0 ? cumTPV / cumVol : 0
}

export function computeORB(bars: Bar[]): OrbResult | null {
  if (bars.length < 2) return null

  // First 15-minute window = first 15 1-min bars (or use provided bars directly)
  const orBars = bars.slice(0, 15)
  const orHigh = Math.max(...orBars.map(b => b.h))
  const orLow = Math.min(...orBars.map(b => b.l))
  const orRange = orHigh - orLow

  const vwap = computeVWAP(bars)

  const latest = bars[bars.length - 1]
  const currentPrice = latest.c
  const currentVolume = latest.v
  const volumeAvg = bars.reduce((s, b) => s + b.v, 0) / bars.length

  return { orHigh, orLow, orRange, vwap, currentPrice, volumeAvg, currentVolume }
}

export function generateSignal(symbol: string, bars: Bar[], hasPosition: boolean): Signal | null {
  if (bars.length < 16) return null

  const orb = computeORB(bars)
  if (!orb) return null

  const { orHigh, orLow, orRange, vwap, currentPrice, volumeAvg, currentVolume } = orb

  // Don't trade if range is too small (choppy market) or too large (excessive volatility)
  const rangePercent = orRange / orLow
  if (rangePercent < 0.002 || rangePercent > 0.05) {
    return { symbol, action: 'hold', reason: `OR range ${(rangePercent * 100).toFixed(2)}% outside tradeable bounds`, price: currentPrice, stopLoss: 0, takeProfit: 0, confidence: 0 }
  }

  const volumeConfirmation = currentVolume > volumeAvg * 1.2
  const priceAboveVWAP = currentPrice > vwap
  const priceBelowVWAP = currentPrice < vwap

  // LONG signal: price breaks above OR high, above VWAP, with volume surge
  if (!hasPosition && currentPrice > orHigh * 1.001 && priceAboveVWAP && volumeConfirmation) {
    const stopLoss = Math.max(orLow, currentPrice * 0.995)
    const riskAmount = currentPrice - stopLoss
    const takeProfit = currentPrice + riskAmount * 2 // 2:1 R/R

    const confidence = Math.min(
      0.3 + (volumeConfirmation ? 0.3 : 0) + (priceAboveVWAP ? 0.2 : 0) + Math.min(rangePercent * 10, 0.2),
      0.95
    )

    return {
      symbol, action: 'buy',
      reason: `ORB breakout above ${orHigh.toFixed(2)}, price ${currentPrice.toFixed(2)} > VWAP ${vwap.toFixed(2)}, volume ${(currentVolume / volumeAvg).toFixed(1)}x avg`,
      price: currentPrice, stopLoss, takeProfit, confidence,
    }
  }

  // EXIT signal: position exists and price drops below VWAP or stop is hit
  if (hasPosition && (priceBelowVWAP || currentPrice < orLow)) {
    return {
      symbol, action: 'sell',
      reason: `Exit: price ${currentPrice.toFixed(2)} ${priceBelowVWAP ? 'below VWAP ' + vwap.toFixed(2) : 'below OR low ' + orLow.toFixed(2)}`,
      price: currentPrice, stopLoss: 0, takeProfit: 0, confidence: 0.9,
    }
  }

  return {
    symbol, action: 'hold',
    reason: `No signal. Price ${currentPrice.toFixed(2)}, OR: ${orLow.toFixed(2)}-${orHigh.toFixed(2)}, VWAP: ${vwap.toFixed(2)}`,
    price: currentPrice, stopLoss: orLow, takeProfit: orHigh + (orHigh - orLow) * 2, confidence: 0,
  }
}

// Position sizing: risk 1% of account per trade
export function calcPositionSize(accountEquity: number, entryPrice: number, stopLoss: number): number {
  const riskAmount = accountEquity * 0.01
  const riskPerShare = entryPrice - stopLoss
  if (riskPerShare <= 0) return 0
  return Math.max(1, Math.floor(riskAmount / riskPerShare))
}

// Default watchlist — high-liquidity, high-volatility stocks good for ORB
export const DEFAULT_WATCHLIST = [
  'SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMD', 'META', 'AMZN', 'GOOGL'
]

import { NextRequest, NextResponse } from 'next/server'
import { alpaca } from '@/lib/alpaca'
import { generateSignal, calcPositionSize, DEFAULT_WATCHLIST } from '@/lib/strategy'

export interface TradeLog {
  timestamp: string
  symbol: string
  action: string
  price: number
  qty?: number
  reason: string
  orderId?: string
  confidence: number
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const watchlist: string[] = body.watchlist ?? DEFAULT_WATCHLIST
  const dryRun: boolean = body.dryRun ?? false

  const logs: TradeLog[] = []

  try {
    const [clock, account, positions] = await Promise.all([
      alpaca.isMarketOpen(),
      alpaca.getAccount(),
      alpaca.getPositions(),
    ])

    if (!clock.is_open) {
      return NextResponse.json({
        skipped: true,
        reason: `Market is closed. Next open: ${clock.next_open}`,
        logs: [],
      })
    }

    const equity = parseFloat(account.equity)
    const positionMap = new Map(positions.map(p => [p.symbol, p]))

    // Fetch 1-min bars for all watchlist symbols
    const barsMap = await alpaca.getMultiBars(watchlist, '1Min', 60)

    // Check EOD close — if after 3:45 PM ET, close all positions
    const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const isEOD = nowET.getHours() >= 15 && nowET.getMinutes() >= 45

    if (isEOD && positions.length > 0) {
      logs.push({
        timestamp: new Date().toISOString(),
        symbol: 'ALL',
        action: 'close_all',
        price: 0,
        reason: 'EOD: closing all positions before market close',
        confidence: 1,
      })
      if (!dryRun) await alpaca.closeAllPositions()
      return NextResponse.json({ logs, eodClose: true })
    }

    for (const symbol of watchlist) {
      const bars = barsMap[symbol]
      if (!bars || bars.length < 16) {
        logs.push({ timestamp: new Date().toISOString(), symbol, action: 'skip', price: 0, reason: 'Insufficient bar data', confidence: 0 })
        continue
      }

      const hasPosition = positionMap.has(symbol)
      const signal = generateSignal(symbol, bars, hasPosition)
      if (!signal) continue

      if (signal.action === 'buy' && signal.confidence >= 0.6) {
        const qty = calcPositionSize(equity, signal.price, signal.stopLoss)
        if (qty < 1) {
          logs.push({ ...signal, timestamp: new Date().toISOString(), qty: 0, reason: signal.reason + ' [qty too small]' })
          continue
        }

        const log: TradeLog = {
          timestamp: new Date().toISOString(),
          symbol, action: 'buy', price: signal.price, qty,
          reason: signal.reason, confidence: signal.confidence,
        }

        if (!dryRun) {
          const order = await alpaca.submitOrder(symbol, qty, 'buy', 'market')
          log.orderId = order.id
        }
        logs.push(log)

      } else if (signal.action === 'sell' && hasPosition) {
        const pos = positionMap.get(symbol)!
        const qty = parseInt(pos.qty)

        const log: TradeLog = {
          timestamp: new Date().toISOString(),
          symbol, action: 'sell', price: signal.price, qty,
          reason: signal.reason, confidence: signal.confidence,
        }

        if (!dryRun) {
          const order = await alpaca.closePosition(symbol)
          log.orderId = order.id
        }
        logs.push(log)

      } else {
        logs.push({
          timestamp: new Date().toISOString(),
          symbol, action: signal.action, price: signal.price,
          reason: signal.reason, confidence: signal.confidence,
        })
      }
    }

    return NextResponse.json({ logs, equity, positionCount: positions.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, logs }, { status: 500 })
  }
}

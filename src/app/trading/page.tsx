'use client'

import { useState, useEffect, useCallback } from 'react'
import { TradeLog } from '../api/trading/run/route'

type Account = { cash: string; equity: string; buying_power: string; portfolio_value: string; daytrade_count: number }
type Position = { symbol: string; qty: string; avg_entry_price: string; current_price: string; unrealized_pl: string; unrealized_plpc: string; market_value: string }
type Order = { id: string; symbol: string; qty: string; side: string; type: string; status: string; filled_avg_price: string | null; created_at: string }
type Clock = { is_open: boolean; next_open: string; next_close: string }
type ResearchReport = {
  date: string; marketOverview: string;
  topStories: { headline: string; symbols: string[]; sentiment: string; summary: string }[]
  watchlist: string[]; sectorOutlook: string; tradeableThemes: string[]; riskFactors: string[]; recommendation: string
}

const SENT_COLOR: Record<string, string> = { bullish: '#16a34a', bearish: '#dc2626', neutral: '#6b7280' }
const ACTION_COLOR: Record<string, string> = { buy: '#16a34a', sell: '#dc2626', hold: '#6b7280', skip: '#9ca3af', close_all: '#f59e0b' }

export default function TradingPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [clock, setClock] = useState<Clock | null>(null)
  const [research, setResearch] = useState<ResearchReport | null>(null)
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([])
  const [watchlist, setWatchlist] = useState('SPY,QQQ,NVDA,TSLA,AAPL,MSFT,AMD,META,AMZN,GOOGL')
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [autoInterval, setAutoInterval] = useState<NodeJS.Timeout | null>(null)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const setLoad = (key: string, val: boolean) => setLoading(p => ({ ...p, [key]: val }))

  const fetchPortfolio = useCallback(async () => {
    setLoad('portfolio', true)
    try {
      const res = await fetch('/api/trading/portfolio')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAccount(data.account)
      setPositions(data.positions)
      setClock(data.clock)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (e: any) { setError(e.message) }
    finally { setLoad('portfolio', false) }
  }, [])

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/trading/orders')
    const data = await res.json()
    if (!data.error) setOrders(data.orders)
  }, [])

  const runResearch = async () => {
    setLoad('research', true)
    setError('')
    try {
      const res = await fetch('/api/trading/research', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResearch(data.report)
      if (data.report.watchlist?.length) setWatchlist(data.report.watchlist.join(','))
    } catch (e: any) { setError(e.message) }
    finally { setLoad('research', false) }
  }

  const runTradeCycle = useCallback(async () => {
    setLoad('trading', true)
    setError('')
    try {
      const res = await fetch('/api/trading/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist: watchlist.split(',').map(s => s.trim()), dryRun }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.logs?.length) setTradeLogs(prev => [...data.logs, ...prev].slice(0, 200))
      await fetchPortfolio()
      await fetchOrders()
    } catch (e: any) { setError(e.message) }
    finally { setLoad('trading', false) }
  }, [watchlist, dryRun, fetchPortfolio, fetchOrders])

  const toggleAuto = () => {
    if (isAutoRunning) {
      if (autoInterval) clearInterval(autoInterval)
      setAutoInterval(null)
      setIsAutoRunning(false)
    } else {
      runTradeCycle()
      const interval = setInterval(runTradeCycle, 15 * 60 * 1000)
      setAutoInterval(interval)
      setIsAutoRunning(true)
    }
  }

  useEffect(() => {
    fetchPortfolio()
    fetchOrders()
    const refresh = setInterval(() => { fetchPortfolio(); fetchOrders() }, 60000)
    return () => clearInterval(refresh)
  }, [fetchPortfolio, fetchOrders])

  const pnl = positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pl || '0'), 0)
  const pnlColor = pnl >= 0 ? '#16a34a' : '#dc2626'

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Stock Trading Agent</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>
            VWAP + Opening Range Breakout Strategy · Paper Trading
            {lastUpdate && <span style={{ marginLeft: 8 }}>· Updated {lastUpdate}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {clock && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: clock.is_open ? '#dcfce7' : '#fef2f2', color: clock.is_open ? '#16a34a' : '#dc2626' }}>
              {clock.is_open ? 'MARKET OPEN' : 'MARKET CLOSED'}
            </span>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
            Dry run
          </label>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Account Stats */}
      {account && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
          {[
            { label: 'Portfolio Value', value: `$${parseFloat(account.portfolio_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Cash', value: `$${parseFloat(account.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Buying Power', value: `$${parseFloat(account.buying_power).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Open P&L', value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, color: pnlColor },
            { label: 'Positions', value: `${positions.length}` },
            { label: 'Day Trades', value: `${account.daytrade_count}` },
          ].map(s => (
            <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: s.color ?? '#111827' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={watchlist}
          onChange={e => setWatchlist(e.target.value)}
          placeholder="Watchlist (comma-separated tickers)"
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
        />
        <button onClick={runResearch} disabled={loading.research}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading.research ? 0.6 : 1 }}>
          {loading.research ? 'Researching...' : 'Run Research'}
        </button>
        <button onClick={runTradeCycle} disabled={loading.trading}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#1d4ed8', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading.trading ? 0.6 : 1 }}>
          {loading.trading ? 'Running...' : 'Run Once'}
        </button>
        <button onClick={toggleAuto}
          style={{ padding: '8px 16px', borderRadius: 8, background: isAutoRunning ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {isAutoRunning ? 'Stop Auto' : 'Auto (15m)'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Positions */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>Open Positions</h2>
          {positions.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No open positions</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {positions.map(p => {
                const pl = parseFloat(p.unrealized_pl)
                const plc = parseFloat(p.unrealized_plpc) * 100
                return (
                  <div key={p.symbol} style={{ padding: '8px 10px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{p.symbol}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{p.qty} shares @ ${parseFloat(p.avg_entry_price).toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#374151' }}>${parseFloat(p.market_value).toFixed(2)}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: pl >= 0 ? '#16a34a' : '#dc2626' }}>
                        {pl >= 0 ? '+' : ''}{pl.toFixed(2)} ({plc.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>Recent Orders</h2>
          {orders.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {orders.slice(0, 20).map(o => (
                <div key={o.id} style={{ padding: '6px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{o.symbol}</span>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: o.side === 'buy' ? '#dcfce7' : '#fef2f2', color: o.side === 'buy' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{o.side.toUpperCase()}</span>
                    <span style={{ color: '#6b7280' }}>{o.qty} shares</span>
                  </div>
                  <div style={{ color: '#6b7280', display: 'flex', gap: 8 }}>
                    {o.filled_avg_price && <span>${parseFloat(o.filled_avg_price).toFixed(2)}</span>}
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#f3f4f6' }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Research Report */}
      {research && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#374151' }}>Research Report</h2>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(research.date).toLocaleString()}</span>
          </div>

          <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#0c4a6e' }}>
            {research.marketOverview}
          </div>

          {research.recommendation && (
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#14532d', fontWeight: 500 }}>
              Recommendation: {research.recommendation}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {research.watchlist.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Watchlist</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {research.watchlist.map(t => (
                    <span key={t} style={{ padding: '3px 8px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            {research.tradeableThemes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Themes</div>
                {research.tradeableThemes.map(t => (
                  <div key={t} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>· {t}</div>
                ))}
              </div>
            )}
            {research.riskFactors.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Risk Factors</div>
                {research.riskFactors.map(r => (
                  <div key={r} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>· {r}</div>
                ))}
              </div>
            )}
          </div>

          {research.topStories.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Top Stories</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {research.topStories.slice(0, 5).map((s, i) => (
                  <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontWeight: 500, color: '#111827' }}>{s.headline}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: SENT_COLOR[s.sentiment] ?? '#6b7280', flexShrink: 0 }}>{s.sentiment}</span>
                    </div>
                    {s.summary && <div style={{ color: '#6b7280', marginTop: 3 }}>{s.summary}</div>}
                    {s.symbols?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {s.symbols.map(t => <span key={t} style={{ padding: '1px 6px', borderRadius: 4, background: '#e0e7ff', color: '#3730a3', fontSize: 11 }}>{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trade Logs */}
      {tradeLogs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#374151' }}>Agent Activity</h2>
            {dryRun && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#fef9c3', color: '#854d0e', fontWeight: 600 }}>DRY RUN — no real orders</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 360, overflowY: 'auto' }}>
            {tradeLogs.map((log, i) => (
              <div key={i} style={{ padding: '6px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span style={{ fontWeight: 700, width: 55, flexShrink: 0 }}>{log.symbol}</span>
                <span style={{ fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#f3f4f6', color: ACTION_COLOR[log.action] ?? '#374151', flexShrink: 0, fontSize: 11 }}>
                  {log.action.toUpperCase()}
                </span>
                {log.qty != null && log.action !== 'hold' && log.action !== 'skip' && (
                  <span style={{ color: '#374151', flexShrink: 0 }}>{log.qty} @ ${log.price.toFixed(2)}</span>
                )}
                <span style={{ color: '#6b7280', flex: 1 }}>{log.reason}</span>
                {log.confidence > 0 && (
                  <span style={{ color: '#9ca3af', flexShrink: 0 }}>{(log.confidence * 100).toFixed(0)}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

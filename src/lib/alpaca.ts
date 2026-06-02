const BASE = 'https://paper-api.alpaca.markets/v2'
const DATA = 'https://data.alpaca.markets/v2'

function headers() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY!,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY!,
    'Content-Type': 'application/json',
  }
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Alpaca GET ${url} → ${res.status}: ${text}`)
  }
  return res.json()
}

async function post<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Alpaca POST ${url} → ${res.status}: ${text}`)
  }
  return res.json()
}

async function del<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE', headers: headers() })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(`Alpaca DELETE ${url} → ${res.status}: ${text}`)
  }
  return res.status === 204 ? ({} as T) : res.json()
}

export interface Account {
  id: string
  cash: string
  portfolio_value: string
  buying_power: string
  equity: string
  daytrade_count: number
  pattern_day_trader: boolean
}

export interface Position {
  symbol: string
  qty: string
  avg_entry_price: string
  current_price: string
  unrealized_pl: string
  unrealized_plpc: string
  side: string
  market_value: string
}

export interface Order {
  id: string
  symbol: string
  qty: string
  side: 'buy' | 'sell'
  type: string
  status: string
  filled_avg_price: string | null
  created_at: string
  limit_price: string | null
  stop_price: string | null
}

export interface Bar {
  t: string  // timestamp
  o: number  // open
  h: number  // high
  l: number  // low
  c: number  // close
  v: number  // volume
  vw: number // vwap
}

export interface NewsItem {
  id: number
  headline: string
  summary: string
  author: string
  created_at: string
  symbols: string[]
  url: string
  source: string
}

export const alpaca = {
  getAccount: () => get<Account>(`${BASE}/account`),

  getPositions: () => get<Position[]>(`${BASE}/positions`),

  getOrders: (status = 'all', limit = 50) =>
    get<Order[]>(`${BASE}/orders?status=${status}&limit=${limit}&direction=desc`),

  submitOrder: (symbol: string, qty: number, side: 'buy' | 'sell', type: 'market' | 'limit' = 'market', limitPrice?: number) =>
    post<Order>(`${BASE}/orders`, {
      symbol,
      qty,
      side,
      type,
      time_in_force: type === 'market' ? 'day' : 'day',
      ...(limitPrice && { limit_price: limitPrice.toFixed(2) }),
    }),

  closePosition: (symbol: string) => del<Order>(`${BASE}/positions/${symbol}`),

  closeAllPositions: () => del<{ canceled_orders: number; closed_positions: number }>(`${BASE}/positions`),

  getBars: async (symbol: string, timeframe: '1Min' | '5Min' | '15Min', limit = 50): Promise<Bar[]> => {
    const url = `${DATA}/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}&feed=iex`
    const data = await get<{ bars: Bar[] }>(url)
    return data.bars ?? []
  },

  getMultiBars: async (symbols: string[], timeframe: '1Min' | '5Min' | '15Min', limit = 20): Promise<Record<string, Bar[]>> => {
    const syms = symbols.join(',')
    const url = `${DATA}/stocks/bars?symbols=${syms}&timeframe=${timeframe}&limit=${limit}&feed=iex`
    const data = await get<{ bars: Record<string, Bar[]> }>(url)
    return data.bars ?? {}
  },

  getNews: async (symbols?: string[], limit = 20): Promise<NewsItem[]> => {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (symbols?.length) params.set('symbols', symbols.join(','))
    const data = await get<{ news: NewsItem[] }>(`${DATA}/news?${params}`)
    return data.news ?? []
  },

  getLatestQuote: async (symbol: string) => {
    const data = await get<{ quote: { ap: number; bp: number } }>(`${DATA}/stocks/${symbol}/quotes/latest?feed=iex`)
    return data.quote
  },

  isMarketOpen: async () => {
    const clock = await get<{ is_open: boolean; next_open: string; next_close: string }>(`${BASE}/clock`)
    return clock
  },
}

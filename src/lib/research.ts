import Anthropic from '@anthropic-ai/sdk'
import { alpaca, NewsItem } from './alpaca'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ResearchReport {
  date: string
  marketOverview: string
  topStories: { headline: string; symbols: string[]; sentiment: 'bullish' | 'bearish' | 'neutral'; summary: string }[]
  watchlist: string[]
  sectorOutlook: string
  tradeableThemes: string[]
  riskFactors: string[]
  recommendation: string
}

export async function runResearch(): Promise<ResearchReport> {
  // 1. Fetch market news from Alpaca
  const generalNews = await alpaca.getNews(undefined, 30)
  const moversNews = await alpaca.getNews(['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMD', 'META'], 20)

  const allNews = dedupeNews([...generalNews, ...moversNews])
  const newsText = allNews.slice(0, 30).map(n =>
    `[${n.created_at.substring(0, 16)}] ${n.headline} (${n.symbols.join(', ')}) — ${n.summary?.substring(0, 200) ?? ''}`
  ).join('\n')

  // 2. Ask Claude to synthesize a market research report
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: `You are a professional day trading research analyst. Your job is to analyze current market news, identify tradeable opportunities, and produce a concise morning briefing optimized for intraday Opening Range Breakout (ORB) + VWAP strategies. Be specific, data-driven, and actionable. Today is ${new Date().toDateString()}.`,
    messages: [{
      role: 'user',
      content: `Here is today's market news feed:\n\n${newsText}\n\nProduce a JSON research report with this exact structure (no markdown, just JSON):\n{\n  "marketOverview": "2-3 sentence macro summary",\n  "topStories": [\n    {"headline": "...", "symbols": ["AAPL"], "sentiment": "bullish|bearish|neutral", "summary": "1 sentence"}\n  ],\n  "watchlist": ["up to 8 ticker symbols to watch for ORB setups today"],\n  "sectorOutlook": "which sectors are hot/cold today",\n  "tradeableThemes": ["theme1", "theme2"],\n  "riskFactors": ["risk1", "risk2"],\n  "recommendation": "1-2 sentence overall day trading recommendation"\n}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  let parsed: Partial<ResearchReport>
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch {
    parsed = { marketOverview: text, watchlist: ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL'] }
  }

  return {
    date: new Date().toISOString(),
    marketOverview: parsed.marketOverview ?? 'No overview available',
    topStories: parsed.topStories ?? [],
    watchlist: parsed.watchlist ?? ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL'],
    sectorOutlook: parsed.sectorOutlook ?? '',
    tradeableThemes: parsed.tradeableThemes ?? [],
    riskFactors: parsed.riskFactors ?? [],
    recommendation: parsed.recommendation ?? '',
  }
}

function dedupeNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<number>()
  return items.filter(n => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })
}

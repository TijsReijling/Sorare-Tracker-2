import { NextResponse } from 'next/server'
import { alpaca } from '@/lib/alpaca'

export async function GET() {
  try {
    const [account, positions, clock] = await Promise.all([
      alpaca.getAccount(),
      alpaca.getPositions(),
      alpaca.isMarketOpen(),
    ])
    return NextResponse.json({ account, positions, clock })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { alpaca } from '@/lib/alpaca'

export async function GET() {
  try {
    const orders = await alpaca.getOrders('all', 50)
    return NextResponse.json({ orders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

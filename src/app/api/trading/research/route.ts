import { NextResponse } from 'next/server'
import { runResearch } from '@/lib/research'

export async function POST() {
  try {
    const report = await runResearch()
    return NextResponse.json({ report })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

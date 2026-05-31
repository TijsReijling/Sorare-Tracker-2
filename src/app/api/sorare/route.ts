import { NextRequest, NextResponse } from 'next/server'
import { getGroupForCountry, getMatchesForGroup, WC_GROUPS } from '@/lib/worldcup'

const SORARE_API = 'https://api.sorare.com/graphql'

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 })
  }

  try {
    const res = await fetch(SORARE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'JWT-AUD': 'sorare-wc-tracker',
      },
      body: JSON.stringify({
        query: `
          query MyCards {
            currentUser {
              slug
              allNfts(first: 100, sport: FOOTBALL) {
                nodes {
                  slug
                  rarity
                  player {
                    displayName
                    position
                    activeClub { shortName }
                    country { slug name }
                  }
                  valuationMarketPrice {
                    referenceCurrency
                    amount
                  }
                  latestAveragePrice {
                    referenceCurrency
                    amount
                  }
                }
              }
            }
          }
        `,
      }),
    })

    const data = await res.json()

    if (data.errors) {
      return NextResponse.json({ error: data.errors[0]?.message ?? 'GraphQL error' }, { status: 400 })
    }

    const nodes = data?.data?.currentUser?.allNfts?.nodes ?? []
    const slug = data?.data?.currentUser?.slug

    // Enrich with WC data
    const players = nodes
      .map((node: any) => {
        const countrySlug = node.player?.country?.slug ?? ''
        const countryName = node.player?.country?.name ?? ''
        const group = getGroupForCountry(countrySlug) ?? getGroupForCountry(countryName)

        const price = node.valuationMarketPrice ?? node.latestAveragePrice
        const priceStr = price
          ? `${parseFloat(price.amount).toFixed(3)} ${price.referenceCurrency}`
          : 'N/A'

        return {
          slug: node.slug,
          name: node.player?.displayName ?? 'Unknown',
          position: node.player?.position ?? '',
          club: node.player?.activeClub?.shortName ?? '',
          country: countryName || countrySlug,
          rarity: node.rarity ?? 'common',
          price: priceStr,
          group: group ?? null,
          matches: group ? getMatchesForGroup(group) : [],
        }
      })

    const wcPlayers = players.filter((p: any) => p.group !== null)
    const allPlayers = players

    return NextResponse.json({ slug, wcPlayers, allPlayers, total: players.length })
  } catch (err) {
    console.error('Squad fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch squad data.' }, { status: 500 })
  }
}

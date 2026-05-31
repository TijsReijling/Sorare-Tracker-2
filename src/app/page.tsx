'use client'

import { useState } from 'react'

type Player = {
  slug: string
  name: string
  position: string
  club: string
  country: string
  rarity: string
  price: string
  group: string | null
  matches: { date: string; home: string; away: string }[]
}

const RARITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  common:     { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
  limited:    { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  rare:       { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  super_rare: { bg: '#ede9fe', text: '#3730a3', border: '#7c3aed' },
  unique:     { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
}

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  Forward:    { bg: '#fed7aa', text: '#7c2d12' },
  Midfielder: { bg: '#bbf7d0', text: '#14532d' },
  Defender:   { bg: '#bfdbfe', text: '#1e3a5f' },
  Goalkeeper: { bg: '#fde68a', text: '#78350f' },
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSessionChallenge, setOtpSessionChallenge] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [wcPlayers, setWcPlayers] = useState<Player[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [posFilter, setPosFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [showAll, setShowAll] = useState(false)

  async function fetchSquad(jwtToken: string) {
    setLoadingMsg('Loading your cards...')
    const squadRes = await fetch('/api/sorare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: jwtToken }),
    })
    const squadData = await squadRes.json()
    if (!squadRes.ok || squadData.error) throw new Error(squadData.error)
    setToken(jwtToken)
    setSlug(squadData.slug)
    setWcPlayers(squadData.wcPlayers)
    setAllPlayers(squadData.allPlayers)
    setTotalCards(squadData.total)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoadingMsg('Authenticating with Sorare...')

    try {
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const authData = await authRes.json()
      if (!authRes.ok || authData.error) throw new Error(authData.error)

      if (authData.requires2FA) {
        setOtpSessionChallenge(authData.otpSessionChallenge)
        setLoading(false)
        return
      }

      await fetchSquad(authData.token)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoadingMsg('Verifying 2FA code...')

    try {
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpSessionChallenge, otpAttempt: otpCode }),
      })
      const authData = await authRes.json()
      if (!authRes.ok || authData.error) throw new Error(authData.error)
      await fetchSquad(authData.token)
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code.')
    } finally {
      setLoading(false)
    }
  }

  const groups = Array.from(new Set(wcPlayers.map(p => p.group).filter(Boolean))) as string[]
  const positions = Array.from(new Set(wcPlayers.map(p => p.position).filter(Boolean)))

  const filtered = wcPlayers.filter(p => {
    if (posFilter && p.position !== posFilter) return false
    if (groupFilter && p.group !== groupFilter) return false
    return true
  })

  if (token) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>⚽ World Cup 2026 tracker</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            {slug} · {wcPlayers.length} of {totalCards} cards in World Cup squads
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
          {[
            { label: 'WC cards', value: wcPlayers.length },
            { label: 'Countries', value: new Set(wcPlayers.map(p => p.country)).size },
            { label: 'Groups', value: groups.length },
            { label: 'Next match', value: 'Jun 11' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={posFilter} onChange={e => setPosFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}>
            <option value=''>All positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}>
            <option value=''>All groups</option>
            {groups.sort().map(g => <option key={g} value={g}>Group {g}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>{filtered.length} players shown</span>
          <button onClick={() => setShowAll(!showAll)}
            style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            {showAll ? 'Show WC only' : 'Show all cards'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {(showAll ? allPlayers : filtered).map(p => {
            const rarity = RARITY_STYLES[p.rarity?.toLowerCase()] ?? RARITY_STYLES.common
            const pos = POS_COLORS[p.position] ?? { bg: '#f3f4f6', text: '#374151' }
            const initials = p.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div key={p.slug} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: pos.bg, color: pos.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{p.position} · {p.club || p.country}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 5, background: rarity.bg, color: rarity.text, border: `1px solid ${rarity.border}` }}>
                    {p.rarity?.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{p.price}</span>
                </div>
                {p.group ? (
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                    <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      🌍 Group {p.group} · {p.country}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.matches.map((m, i) => {
                        const isPlaying = m.home === p.country || m.away === p.country
                        if (!isPlaying) return null
                        return (
                          <div key={i} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#14532d', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{m.home} vs {m.away}</span>
                            <span style={{ fontWeight: 600 }}>{m.date}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                    Not in World Cup squad
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '2rem', width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>⚽ Sorare WC Tracker</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '6px 0 0' }}>
            See which of your Sorare cards are playing at the 2026 World Cup and when.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>{loadingMsg}</div>
          </div>
        ) : otpSessionChallenge ? (
          <form onSubmit={handleOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
              🔐 Two-factor authentication is enabled on your account. Check your email or authenticator app for a code.
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>2FA code</label>
              <input type='text' value={otpCode} onChange={e => setOtpCode(e.target.value)} required
                placeholder='123456' maxLength={6}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', letterSpacing: '0.2em' }} />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}
            <button type='submit'
              style={{ padding: '10px', borderRadius: 8, background: '#1d4ed8', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Verify →
            </button>
            <button type='button' onClick={() => setOtpSessionChallenge(null)}
              style={{ padding: '8px', borderRadius: 8, background: 'none', color: '#6b7280', border: '1px solid #d1d5db', fontSize: 13, cursor: 'pointer' }}>
              ← Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Sorare email</label>
              <input type='email' value={email} onChange={e => setEmail(e.target.value)} required
                placeholder='you@example.com'
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Password</label>
              <input type='password' value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}
            <button type='submit'
              style={{ padding: '10px', borderRadius: 8, background: '#1d4ed8', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
              Connect my Sorare account →
            </button>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
              Your credentials are sent to your own server only, never stored.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}

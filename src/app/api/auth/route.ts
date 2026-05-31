import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const SORARE_API = 'https://api.sorare.com/graphql'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  try {
    // Step 1: Get salt
    const saltRes = await fetch(`https://api.sorare.com/api/v1/users/${encodeURIComponent(email)}`)
    if (!saltRes.ok) {
      return NextResponse.json({ error: 'User not found. Check your email.' }, { status: 404 })
    }
    const { salt } = await saltRes.json()
    if (!salt) {
      return NextResponse.json({ error: 'Could not retrieve salt for this account.' }, { status: 400 })
    }

    // Step 2: Hash password with bcrypt-style hash using the salt
    // Sorare uses bcrypt: hash = SHA256(password + salt) — but actually uses the raw salt string
    // The actual approach: use the salt as returned and hash with SHA-256
    const hashHex = crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex')

    // Step 3: Sign in
    const signInRes = await fetch(SORARE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(input: { email: $email, password: $password }) {
              currentUser {
                slug
                jwtToken(aud: "sorare-wc-tracker") {
                  token
                  expiredAt
                }
              }
              errors { message }
            }
          }
        `,
        variables: { email, password: hashHex },
      }),
    })

    const signInData = await signInRes.json()
    const result = signInData?.data?.signIn

    if (result?.errors?.length) {
      return NextResponse.json({ error: result.errors[0].message }, { status: 401 })
    }

    const token = result?.currentUser?.jwtToken?.token
    const slug = result?.currentUser?.slug

    if (!token) {
      return NextResponse.json({ error: 'Login failed — no token returned.' }, { status: 401 })
    }

    return NextResponse.json({ token, slug })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error during authentication.' }, { status: 500 })
  }
}

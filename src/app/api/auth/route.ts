import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const SORARE_API = 'https://api.sorare.com/graphql'
const JWT_AUD = 'sorare-wc-tracker'

const SIGN_IN_MUTATION = `
  mutation SignIn($input: signInInput!) {
    signIn(input: $input) {
      currentUser {
        slug
        jwtToken(aud: "${JWT_AUD}") {
          token
          expiredAt
        }
      }
      otpSessionChallenge
      errors { message }
    }
  }
`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, otpSessionChallenge, otpAttempt } = body

  try {
    let variables: Record<string, unknown>

    if (otpSessionChallenge && otpAttempt) {
      // 2FA second step
      variables = { input: { otpSessionChallenge, otpAttempt } }
    } else {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }

      // Step 1: Get salt
      const saltRes = await fetch(`https://api.sorare.com/api/v1/users/${encodeURIComponent(email)}`)
      if (!saltRes.ok) {
        return NextResponse.json({ error: 'User not found — check your email address.' }, { status: 404 })
      }
      const { salt } = await saltRes.json()
      if (!salt) {
        return NextResponse.json({ error: 'Could not retrieve salt for this account.' }, { status: 400 })
      }

      // Step 2: Hash password with bcrypt using the salt from Sorare
      const hashedPassword = bcrypt.hashSync(password, salt)

      variables = { input: { email, password: hashedPassword } }
    }

    // Step 3: Sign in
    const signInRes = await fetch(SORARE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: SIGN_IN_MUTATION, variables }),
    })

    const signInData = await signInRes.json()
    const result = signInData?.data?.signIn

    if (!result) {
      return NextResponse.json({ error: 'No response from Sorare API.' }, { status: 500 })
    }

    if (result.errors?.length) {
      return NextResponse.json({ error: result.errors[0].message }, { status: 401 })
    }

    // 2FA required
    if (result.otpSessionChallenge && !result.currentUser) {
      return NextResponse.json({ requires2FA: true, otpSessionChallenge: result.otpSessionChallenge })
    }

    const token = result.currentUser?.jwtToken?.token
    const slug = result.currentUser?.slug

    if (!token) {
      return NextResponse.json({ error: 'Login failed — no token returned.' }, { status: 401 })
    }

    return NextResponse.json({ token, slug })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error during authentication.' }, { status: 500 })
  }
}

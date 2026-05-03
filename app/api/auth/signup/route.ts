import { NextRequest, NextResponse } from 'next/server'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'

function headers() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const apiKey = process.env.APPWRITE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Create user via AppWrite server-side API
    const res = await fetch(`${APPWRITE_ENDPOINT}/users`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        userId: 'unique()',
        email,
        password,
        name,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const errMsg = data?.message || data?.type || 'Failed to create account'
      console.error('[Signup API] Error:', errMsg, data)
      
      if (res.status === 409) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
      }
      
      return NextResponse.json({ error: errMsg }, { status: res.status })
    }

    // Send verification email
    const verifyUrl = `${request.nextUrl.origin}/verify`
    await fetch(`${APPWRITE_ENDPOINT}/users/${data.$id}/verification`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ url: verifyUrl }),
    })

    console.log('[Signup API] Account created:', email)
    return NextResponse.json({ success: true, userId: data.$id }, { status: 201 })

  } catch (err: any) {
    console.error('[Signup API] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

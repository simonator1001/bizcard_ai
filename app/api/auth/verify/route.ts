import { NextRequest, NextResponse } from 'next/server'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'

function appwriteHeaders() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 })
    }

    // 1. Fetch user preferences to get stored token
    const prefsRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
      method: 'GET',
      headers: appwriteHeaders(),
    })

    if (!prefsRes.ok) {
      console.error('[Verify API] Failed to get user prefs:', await prefsRes.text())
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const prefs = await prefsRes.json()
    const storedToken = prefs?.verificationToken
    const expiresAt = prefs?.verificationTokenExpires

    // 2. Validate token
    if (!storedToken || storedToken !== token) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 })
    }

    if (expiresAt && Date.now() > expiresAt) {
      return NextResponse.json({ error: 'Verification link has expired. Please sign up again.' }, { status: 400 })
    }

    // 3. Mark email as verified
    const verifyRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/verification`, {
      method: 'PATCH',
      headers: appwriteHeaders(),
      body: JSON.stringify({ emailVerification: true }),
    })

    if (!verifyRes.ok) {
      console.error('[Verify API] Failed to verify user:', await verifyRes.text())
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
    }

    // 4. Clean up token from preferences
    await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
      method: 'PATCH',
      headers: appwriteHeaders(),
      body: JSON.stringify({
        prefs: {
          verificationToken: null,
          verificationTokenExpires: null,
        },
      }),
    })

    console.log('[Verify API] Email verified for user:', userId)
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[Verify API] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

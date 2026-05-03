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
    const { userId, token, password } = await request.json()

    if (!userId || !token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // 1. Fetch user preferences to validate token
    const prefsRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
      method: 'GET',
      headers: appwriteHeaders(),
    })

    if (!prefsRes.ok) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const prefs = await prefsRes.json()
    const storedToken = prefs?.recoveryToken
    const expiresAt = prefs?.recoveryTokenExpires

    // 2. Validate token
    if (!storedToken || storedToken !== token) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (expiresAt && Date.now() > expiresAt) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // 3. Update password
    const updateRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/password`, {
      method: 'PATCH',
      headers: appwriteHeaders(),
      body: JSON.stringify({ password }),
    })

    if (!updateRes.ok) {
      const errData = await updateRes.json()
      console.error('[ResetPassword API] Failed to update password:', errData)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // 4. Clean up token
    await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
      method: 'PATCH',
      headers: appwriteHeaders(),
      body: JSON.stringify({
        prefs: {
          recoveryToken: null,
          recoveryTokenExpires: null,
        },
      }),
    })

    console.log('[ResetPassword API] Password updated for user:', userId)
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[ResetPassword API] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

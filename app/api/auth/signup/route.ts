import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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

    // 1. Create user via AppWrite server-side API
    const res = await fetch(`${APPWRITE_ENDPOINT}/users`, {
      method: 'POST',
      headers: appwriteHeaders(),
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

    const userId = data.$id

    // 2. Generate verification token + store in user preferences
    const token = crypto.randomUUID()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    const prefsRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
      method: 'PATCH',
      headers: appwriteHeaders(),
      body: JSON.stringify({
        prefs: {
          verificationToken: token,
          verificationTokenExpires: expiresAt,
        },
      }),
    })

    if (!prefsRes.ok) {
      console.error('[Signup API] Failed to store verification token:', await prefsRes.text())
    }

    // 3. Send verification email via Resend
    const verifyUrl = `${request.nextUrl.origin}/verify?userId=${userId}&token=${token}`
    const resendKey = process.env.RESEND_API_KEY

    if (resendKey) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BizCard AI <noreply@simon-gpt.com>',
          to: [email],
          subject: 'Verify your BizCard AI email',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#4F46E5">🦞 BizCard AI</h2>
              <p>Thanks for signing up, <strong>${name}</strong>!</p>
              <p>Click the button below to verify your email address:</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
              <p style="color:#6B7280;font-size:14px">Or copy this link:</p>
              <p style="color:#6B7280;font-size:12px;word-break:break-all">${verifyUrl}</p>
              <p style="color:#9CA3AF;font-size:12px;margin-top:24px">This link expires in 24 hours.</p>
            </div>
          `,
        }),
      })

      if (!emailRes.ok) {
        const errText = await emailRes.text()
        console.error('[Signup API] Failed to send verification email:', errText)
        // Don't fail signup if email fails — user can request resend later
      } else {
        console.log('[Signup API] Verification email sent to:', email)
      }
    }

    console.log('[Signup API] Account created:', email, userId)
    return NextResponse.json({ success: true, userId }, { status: 201 })

  } catch (err: any) {
    console.error('[Signup API] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

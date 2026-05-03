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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 1. Find user by email
    const searchRes = await fetch(
      `${APPWRITE_ENDPOINT}/users?search=${encodeURIComponent(email)}`,
      { headers: appwriteHeaders() }
    )
    const searchData = await searchRes.json()

    if (!searchRes.ok || !searchData.users?.length) {
      // Don't reveal if user exists — always return success
      return NextResponse.json({ success: true })
    }

    const user = searchData.users.find((u: any) => u.email === email)
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const userId = user.$id

    // 2. Generate recovery token
    const token = crypto.randomUUID()
    const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hour

    await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
      method: 'PATCH',
      headers: appwriteHeaders(),
      body: JSON.stringify({
        prefs: {
          recoveryToken: token,
          recoveryTokenExpires: expiresAt,
        },
      }),
    })

    // 3. Send recovery email via Resend
    const resetUrl = `${request.nextUrl.origin}/reset-password?userId=${userId}&token=${token}`
    const resendKey = process.env.RESEND_API_KEY

    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BizCard AI <noreply@simon-gpt.com>',
          to: [email],
          subject: 'Reset your BizCard AI password',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#4F46E5">🦞 BizCard AI</h2>
              <p>You requested a password reset.</p>
              <p>Click the button below to set a new password:</p>
              <a href="${resetUrl}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
              <p style="color:#6B7280;font-size:14px">Or copy this link:</p>
              <p style="color:#6B7280;font-size:12px;word-break:break-all">${resetUrl}</p>
              <p style="color:#9CA3AF;font-size:12px;margin-top:24px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[ForgotPassword API] Error:', err)
    return NextResponse.json({ success: true }) // Don't reveal errors
  }
}

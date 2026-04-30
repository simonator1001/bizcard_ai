import { NextRequest, NextResponse } from 'next/server'

// Server-side OAuth callback: exchanges Google code → creates AppWrite session → sets cookie on our domain
// This COMPLETELY bypasses third-party cookie blocking (no cross-domain Set-Cookie needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('[OAuth] Google returned error:', error)
    return NextResponse.redirect(new URL('/signin?error=' + encodeURIComponent(error), request.url))
  }

  if (!code) {
    console.error('[OAuth] No code received')
    return NextResponse.redirect(new URL('/signin?error=no_code', request.url))
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
    const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
    const appwriteProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '69efa226000db23fcd89'
    const appwriteKey = process.env.APPWRITE_API_KEY

    if (!clientId || !clientSecret) throw new Error('Google OAuth not configured')
    if (!appwriteKey) throw new Error('AppWrite API key not configured')

    const awHeaders = {
      'Content-Type': 'application/json',
      'X-Appwrite-Key': appwriteKey,
      'X-Appwrite-Project': appwriteProject,
    }

    // Step 1: Exchange Google code for tokens
    console.log('[OAuth] Exchanging code for tokens...')
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const tokens = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokens.error_description || 'Token exchange failed')

    // Step 2: Get Google user info
    console.log('[OAuth] Fetching Google user info...')
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json()
    if (!userRes.ok) throw new Error('Failed to get user info')
    console.log('[OAuth] Google user:', { email: googleUser.email, name: googleUser.name })

    // Step 3: Find or create AppWrite user
    let userId: string
    
    console.log('[OAuth] Creating AppWrite user for:', googleUser.email)
    const createRes = await fetch(`${appwriteEndpoint}/users`, {
      method: 'POST',
      headers: awHeaders,
      body: JSON.stringify({
        userId: 'unique()',
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
      }),
    })
    const createData = await createRes.json()
    
    if (createRes.ok && createData.$id) {
      userId = createData.$id
      console.log('[OAuth] Created new user:', userId)
    } else if (createRes.status === 409) {
      console.log('[OAuth] User exists, searching for ID...')
      const searchRes = await fetch(
        `${appwriteEndpoint}/users?search=${encodeURIComponent(googleUser.email)}&limit=1`,
        { headers: awHeaders }
      )
      const searchData = await searchRes.json()
      
      if (searchData.total > 0 && searchData.users?.[0]) {
        userId = searchData.users[0].$id
        console.log('[OAuth] Found existing user:', userId)
      } else {
        throw new Error(`User exists but search failed: ${JSON.stringify(searchData)}`)
      }
    } else {
      throw new Error(`User creation failed: ${JSON.stringify(createData)}`)
    }

    // Step 4: Create a user token (one-time secret)
    console.log('[OAuth] Creating user token...')
    const tokenRes2 = await fetch(`${appwriteEndpoint}/users/${userId}/tokens`, {
      method: 'POST',
      headers: awHeaders,
    })
    const tokenData = await tokenRes2.json()
    if (!tokenRes2.ok || !tokenData.secret) {
      throw new Error(`Token creation failed: ${JSON.stringify(tokenData)}`)
    }
    console.log('[OAuth] Token created, secret length:', tokenData.secret.length)

    // Step 5: Create a session using the token (SERVER-SIDE — consumes the token)
    console.log('[OAuth] Creating session from token...')
    const sessionRes = await fetch(`${appwriteEndpoint}/account/sessions/token`, {
      method: 'POST',
      headers: awHeaders,
      body: JSON.stringify({ userId, secret: tokenData.secret }),
    })
    const sessionData = await sessionRes.json()
    if (!sessionRes.ok || !sessionData.secret) {
      throw new Error(`Session creation failed: ${JSON.stringify(sessionData)}`)
    }
    console.log('[OAuth] ✅ Session created, ID:', sessionData.$id)

    // Step 6: Set session secret as a cookie on OUR domain (NOT AppWrite's domain)
    // The client reads this cookie and uses client.setSession() — zero cross-domain cookie issues!
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('aw_session', sessionData.secret, {
      httpOnly: false,   // JS needs to read it for AppWrite SDK
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    console.log('[OAuth] 🎉 Redirecting to / with session cookie set on our domain')
    return response

  } catch (err: any) {
    console.error('[OAuth] ❌ Error:', err)
    return NextResponse.redirect(
      new URL(`/auth/callback?error=${encodeURIComponent(err.message)}`, request.url)
    )
  }
}

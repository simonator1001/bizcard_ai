import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// Auto-search LinkedIn by name+company and return best match URL + photo
export async function POST(req: NextRequest) {
  try {
    const { name, company, cardId } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const query = `${name} ${company || ''} linkedin`.trim()
    console.log('[AutoSearch] Looking up:', query)

    // Search Google for LinkedIn profile
    let linkedinUrl: string | null = null

    // Strategy: Search via DuckDuckGo HTML (non-JS search)
    const searchUrls = [
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}+site:linkedin.com/in`,
      `https://www.google.com/search?q=${encodeURIComponent('site:linkedin.com/in "' + name + '" ' + (company || ''))}&num=5`,
    ]

    for (const searchUrl of searchUrls) {
      if (linkedinUrl) break
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(searchUrl)}`
        const res = await fetch(proxyUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html'
          }
        })
        if (!res.ok) continue

        const html = await res.text()
        const match = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/)
        if (match) {
          linkedinUrl = match[0].replace(/&amp;/g, '&')
          console.log('[AutoSearch] Found:', linkedinUrl)
        }
      } catch (e: any) {
        console.warn('[AutoSearch] Search failed:', e.message)
      }
    }

    if (!linkedinUrl) {
      // Fallback: return Google search URL for manual lookup
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
      return NextResponse.json({
        success: false,
        error: 'Could not auto-find LinkedIn profile',
        googleSearchUrl: googleUrl,
        requiresManualInput: true,
      })
    }

    // Now fetch the profile photo
    try {
      const photoRes = await fetch(`https://bizcardai.vercel.app/api/linkedin/fetch-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl, cardId }),
      })

      const photoData = await photoRes.json()

      if (photoData.success) {
        return NextResponse.json({
          success: true,
          profile_pic_url: photoData.profile_pic_url,
          linkedin_url: linkedinUrl,
          autoMatched: true,
        })
      }

      // Photo fetch failed but we found the URL
      return NextResponse.json({
        success: false,
        linkedinUrl,
        error: photoData.error || 'Could not extract profile photo',
        requiresManualInput: false,
      })
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        linkedinUrl,
        error: 'Found profile but photo fetch failed',
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

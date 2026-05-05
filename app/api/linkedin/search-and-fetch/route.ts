import { NextRequest, NextResponse } from 'next/server'
import { Client, Databases } from 'node-appwrite'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'

export const runtime = 'nodejs'
export const maxDuration = 30

function getAppWriteClient(): Client {
  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || '')
}

// Search Google for a LinkedIn profile matching name + company
async function findLinkedInProfile(name: string, company?: string): Promise<string | null> {
  const query = `${name} ${company || ''} linkedin profile`.trim()
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=en`

  console.log('[LinkedIn Search] Searching:', query)

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      console.warn('[LinkedIn Search] Google search failed:', res.status)
      return null
    }

    const html = await res.text()

    // Extract LinkedIn profile URLs from Google search results
    // LinkedIn profiles look like: linkedin.com/in/username
    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/g
    const matches = html.matchAll(linkedinRegex)

    const profiles: { url: string; username: string }[] = []
    for (const match of matches) {
      const url = match[0]
      const username = match[1]
      // Skip common non-profile LinkedIn URLs
      if (username === 'jobs' || username === 'company' || username === 'school' || username === 'feed') continue
      // Avoid duplicates
      if (!profiles.find(p => p.username === username)) {
        profiles.push({ url, username })
      }
    }

    if (profiles.length === 0) {
      console.warn('[LinkedIn Search] No LinkedIn profiles found in search results')
      return null
    }

    // Pick the best match — prefer exact name match in the URL username
    const nameLower = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const bestMatch = profiles.find(p => p.username.toLowerCase().includes(nameLower))
      || profiles[0]

    console.log(`[LinkedIn Search] Found ${profiles.length} profiles, best: ${bestMatch.url}`)
    return bestMatch.url
  } catch (err: any) {
    console.warn('[LinkedIn Search] Error:', err.message)
    return null
  }
}

// Fetch og:image from a LinkedIn profile page
async function getProfilePhoto(linkedinUrl: string): Promise<string | null> {
  try {
    const res = await fetch(linkedinUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    if (!res.ok) return null

    const html = await res.text()

    // Extract og:image
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i)

    return ogMatch?.[1] || null
  } catch (err: any) {
    console.warn('[LinkedIn Photo] Error fetching profile:', err.message)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, company, cardId } = await req.json()

    if (!name || !cardId) {
      return NextResponse.json({ error: 'name and cardId are required' }, { status: 400 })
    }

    console.log(`[SearchAndFetch] Looking up: ${name} / ${company || 'N/A'}`)

    // Step 1: Find the LinkedIn profile via Google search
    const linkedinUrl = await findLinkedInProfile(name, company)

    if (!linkedinUrl) {
      return NextResponse.json({
        success: false,
        error: 'Could not find LinkedIn profile. Please provide the LinkedIn URL manually.',
        requiresManualInput: true,
      })
    }

    // Step 2: Fetch the profile photo
    const photoUrl = await getProfilePhoto(linkedinUrl)

    if (!photoUrl) {
      return NextResponse.json({
        success: false,
        error: 'Found LinkedIn profile but could not extract photo. The profile may be private.',
        linkedinUrl,
        requiresManualInput: false,
      })
    }

    // Step 3: Update the card
    const client = getAppWriteClient()
    const databases = new Databases(client)

    await databases.updateDocument(
      DATABASE_ID,
      CARDS_COLLECTION,
      cardId,
      {
        profile_pic_url: photoUrl,
        linkedin_url: linkedinUrl,
      }
    )

    console.log('[SearchAndFetch] Card updated:', cardId)

    return NextResponse.json({
      success: true,
      profile_pic_url: photoUrl,
      linkedin_url: linkedinUrl,
      autoMatched: true,
    })
  } catch (error: any) {
    console.error('[SearchAndFetch] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

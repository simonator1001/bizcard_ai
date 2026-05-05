import { NextRequest, NextResponse } from 'next/server'
import { Client, Storage, Databases, ID } from 'node-appwrite'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'
const STORAGE_BUCKET = 'card_images'

export const runtime = 'nodejs'
export const maxDuration = 30

function getAppWriteClient(): Client {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || '')
  return client
}

export async function POST(req: NextRequest) {
  try {
    const { linkedinUrl, cardId } = await req.json()

    if (!linkedinUrl || !cardId) {
      return NextResponse.json({ error: 'linkedinUrl and cardId are required' }, { status: 400 })
    }

    // Clean the LinkedIn URL — accept full URLs or just the username
    let profileUrl = linkedinUrl.trim()
    if (!profileUrl.startsWith('http')) {
      // Accept "username" or "in/username"
      const username = profileUrl.replace(/^in\//, '')
      profileUrl = `https://www.linkedin.com/in/${username}`
    }

    // Validate it looks like a LinkedIn URL
    if (!profileUrl.includes('linkedin.com/in/')) {
      return NextResponse.json({ error: 'Invalid LinkedIn profile URL. Should be like linkedin.com/in/username' }, { status: 400 })
    }

    console.log('[LinkedIn] Fetching profile:', profileUrl)

    // Step 1: Try multiple strategies to fetch the LinkedIn public profile page
    let html: string | null = null

    // Strategy 1: Direct fetch
    try {
      const profileRes = await fetch(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-platform': '"macOS"',
        },
        redirect: 'follow',
      })
      if (profileRes.ok) html = await profileRes.text()
    } catch (e: any) {
      console.warn('[LinkedIn] Strategy 1 (direct) failed:', e.message)
    }

    // Strategy 2: Try via CORS proxy
    if (!html) {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(profileUrl)}`
        const proxyRes = await fetch(proxyUrl, { headers: { 
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }})
        if (proxyRes.ok) html = await proxyRes.text()
      } catch (e: any) {
        console.warn('[LinkedIn] Strategy 2 (corsproxy) failed:', e.message)
      }
    }

    // Strategy 3: Try Google Web Cache
    if (!html) {
      try {
        const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(profileUrl)}`
        const cacheRes = await fetch(cacheUrl, { headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }})
        if (cacheRes.ok) html = await cacheRes.text()
      } catch (e: any) {
        console.warn('[LinkedIn] Strategy 3 (cache) failed:', e.message)
      }
    }

    if (!html) {
      return NextResponse.json({
        error: 'Could not fetch LinkedIn profile. The profile may be private, or LinkedIn blocks automated access. Try opening the profile in your browser and copying the profile photo URL directly.',
        suggestion: 'Right-click the profile photo on LinkedIn → Copy Image Address → paste into the URL field'
      }, { status: 502 })
    }

    // Step 2: Extract profile picture from og:image meta tag
    // LinkedIn public profiles include og:image with the profile picture
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i)

    if (!ogImageMatch || !ogImageMatch[1]) {
      // Try alternative: look for the profile photo in JSON-LD or other tags
      const imgMatch = html.match(/<img[^>]*class="[^"]*profile-photo[^"]*"[^>]*src="([^"]+)"/i)
        || html.match(/class="presence-entity__image[^"]*"[^>]*src="([^"]+)"/i)

      if (!imgMatch || !imgMatch[1]) {
        console.log('[LinkedIn] No profile photo found in meta tags')
        return NextResponse.json({
          error: 'Could not find profile photo on the LinkedIn page. The profile may be private or not fully loaded.'
        }, { status: 404 })
      }

      const imgUrl = imgMatch[1]
      return await downloadAndStorePhoto(imgUrl, cardId, profileUrl)
    }

    const photoUrl = ogImageMatch[1]
    console.log('[LinkedIn] Found og:image:', photoUrl)

    return await downloadAndStorePhoto(photoUrl, cardId, profileUrl)
  } catch (error: any) {
    console.error('[LinkedIn] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

async function downloadAndStorePhoto(photoUrl: string, cardId: string, linkedinUrl: string) {
  try {
    console.log('[LinkedIn] Trying to download photo:', photoUrl)

    let profilePicUrl: string | null = null

    // Step 3: Try to download the photo from LinkedIn CDN
    try {
      const photoRes = await fetch(photoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://www.linkedin.com/',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })

      if (photoRes.ok) {
        const contentType = photoRes.headers.get('content-type') || 'image/jpeg'
        const photoBuffer = Buffer.from(await photoRes.arrayBuffer())

        const ext = contentType.includes('png') ? 'png' :
          contentType.includes('webp') ? 'webp' : 'jpg'
        const filename = `linkedin_${cardId}_${Date.now()}.${ext}`

        // Upload to AppWrite Storage
        const client = getAppWriteClient()
        const storage = new Storage(client)

        const uploadedFile = await storage.createFile(
          STORAGE_BUCKET,
          ID.unique(),
          new File([photoBuffer], filename, { type: contentType }),
        )

        profilePicUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${uploadedFile.bucketId}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}&mode=admin`
        console.log('[LinkedIn] Uploaded to AppWrite:', profilePicUrl)
      }
    } catch (downloadErr: any) {
      console.warn('[LinkedIn] Could not download photo, using CDN URL directly:', downloadErr.message)
    }

    // Step 4: Fallback — use LinkedIn CDN URL directly (long-lived, expires 2038)
    if (!profilePicUrl) {
      console.log('[LinkedIn] Using LinkedIn CDN URL directly')
      profilePicUrl = photoUrl
    }

    // Step 5: Update the card document
    const client = getAppWriteClient()
    const databases = new Databases(client)
    await databases.updateDocument(
      DATABASE_ID,
      CARDS_COLLECTION,
      cardId,
      {
        profile_pic_url: profilePicUrl,
        linkedin_url: linkedinUrl,
      }
    )

    console.log('[LinkedIn] Card updated with profile pic:', profilePicUrl)

    return NextResponse.json({
      success: true,
      profile_pic_url: profilePicUrl,
      linkedin_url: linkedinUrl,
    })
  } catch (error: any) {
    console.error('[LinkedIn] downloadAndStorePhoto error:', error)
    return NextResponse.json({ error: error.message || 'Failed to store photo' }, { status: 500 })
  }
}

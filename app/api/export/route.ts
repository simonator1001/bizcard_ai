import { NextRequest, NextResponse } from 'next/server'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'

function appwriteHeaders(apiKey: string) {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': apiKey,
    'Content-Type': 'application/json',
  }
}

/**
 * Fetch all cards for a given user from AppWrite, handling pagination.
 * AppWrite's default page limit is 100, so we loop until all documents are retrieved.
 */
async function fetchAllCards(userId: string, apiKey: string): Promise<any[]> {
  const allDocuments: any[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${CARDS_COLLECTION}/documents`
    // AppWrite REST API uses queries as query params
    const queryParams = [
      `queries[]=equal("user_id","${encodeURIComponent(userId)}")`,
      `queries[]=orderDesc("$createdAt")`,
      `queries[]=limit(${limit})`,
      `queries[]=offset(${offset})`,
    ].join('&')

    const response = await fetch(`${url}?${queryParams}`, {
      headers: appwriteHeaders(apiKey),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`AppWrite fetch failed: ${err.message || response.statusText}`)
    }

    const result = await response.json()
    allDocuments.push(...result.documents)

    if (result.documents.length < limit) {
      break // last page
    }
    offset += limit
  }

  return allDocuments
}

function escapeCSV(value: string | undefined | null): string {
  if (!value) return ''
  // Escape double quotes and wrap in quotes if contains comma, quote, or newline
  const str = String(value).replace(/"/g, '""')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`
  }
  return str
}

function generateCSV(cards: any[]): string {
  const headers = [
    'name', 'name_zh', 'title', 'title_zh',
    'company', 'company_zh', 'email', 'phone',
    'address', 'address_zh',
  ]

  const headerRow = headers.join(',')
  const rows = cards.map(card =>
    headers.map(h => escapeCSV(card[h])).join(',')
  )

  return [headerRow, ...rows].join('\n')
}

function generateVCard(cards: any[]): string {
  const vcards: string[] = []

  for (const card of cards) {
    const lines: string[] = [
      'BEGIN:VCARD',
      'VERSION:3.0',
    ]

    const fullName = card.name || card.name_zh || ''
    if (fullName) lines.push(`FN:${fullName}`)
    if (card.name) lines.push(`N:${card.name};;;;`)
    if (card.name_zh) lines.push(`X-PHONETIC-LAST-NAME:${card.name_zh}`)
    if (card.title) lines.push(`TITLE:${card.title}`)
    if (card.title_zh) lines.push(`X-TITLE-ZH:${card.title_zh}`)
    if (card.company) lines.push(`ORG:${card.company}`)
    if (card.company_zh) lines.push(`X-ORG-ZH:${card.company_zh}`)
    if (card.email) lines.push(`EMAIL:${card.email}`)
    if (card.phone) lines.push(`TEL:${card.phone}`)
    if (card.address) lines.push(`ADR:;;${card.address};;;;`)
    if (card.address_zh) lines.push(`X-ADR-ZH:${card.address_zh}`)

    lines.push('END:VCARD')
    vcards.push(lines.join('\n'))
  }

  return vcards.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, appwriteJWT, format } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    if (!format || !['csv', 'vcard'].includes(format)) {
      return NextResponse.json({ error: 'Format must be "csv" or "vcard"' }, { status: 400 })
    }

    const apiKey = process.env.APPWRITE_API_KEY
    if (!apiKey) {
      console.error('[EXPORT] APPWRITE_API_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify JWT against AppWrite
    if (appwriteJWT) {
      try {
        const verifyRes = await fetch(`${APPWRITE_ENDPOINT}/account`, {
          headers: {
            'X-Appwrite-Project': PROJECT_ID,
            'X-Appwrite-JWT': appwriteJWT,
          },
        })
        if (!verifyRes.ok) {
          console.warn('[EXPORT] JWT verification failed (status %s)', verifyRes.status)
          return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
        }
        const account = await verifyRes.json()
        if (account.$id !== userId) {
          console.warn('[EXPORT] User ID mismatch: JWT=%s ≠ body=%s', account.$id, userId)
          return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
        }
        console.log('[EXPORT] JWT verified for:', account.email)
      } catch (jwtErr: any) {
        console.error('[EXPORT] JWT verification error:', jwtErr.message)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      }
    } else {
      console.warn('[EXPORT] No JWT provided — authentication required')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch all cards for this user
    console.log('[EXPORT] Fetching cards for user:', userId)
    const cards = await fetchAllCards(userId, apiKey)
    console.log('[EXPORT] Found %d cards', cards.length)

    // Generate the export content
    let content: string
    let contentType: string
    let filename: string

    if (format === 'csv') {
      content = generateCSV(cards)
      contentType = 'text/csv; charset=utf-8'
      filename = 'bizcard-contacts.csv'
    } else {
      content = generateVCard(cards)
      contentType = 'text/vcard; charset=utf-8'
      filename = 'bizcard-contacts.vcf'
    }

    // Return as downloadable file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(Buffer.byteLength(content, 'utf-8')),
      },
    })
  } catch (error: any) {
    console.error('[EXPORT] Error:', error.message)
    return NextResponse.json(
      { error: 'Failed to export contacts', message: error.message },
      { status: 500 }
    )
  }
}

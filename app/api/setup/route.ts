import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const COLLECTION_ID = 'business_cards'

function headers() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  }
}

async function createAttribute(key: string, type: string, size?: number, required = false) {
  const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/${type}`
  const body: any = { key, required, array: false }
  if (size) body.size = size

  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { key, status: res.status, ok: res.ok, message: data.message || data.$id || 'created' }
}

export async function GET() {
  const results = []

  // Create missing attributes for the new features
  results.push(await createAttribute('profile_pic_url', 'string', 2000))
  results.push(await createAttribute('linkedin_url', 'string', 1000))
  results.push(await createAttribute('images', 'string', 5000)) // JSON array as string since AppWrite array support varies

  return NextResponse.json({
    success: true,
    collection: COLLECTION_ID,
    results,
    note: 'images stored as JSON string in text field for compatibility'
  })
}

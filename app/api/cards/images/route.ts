import { NextRequest, NextResponse } from 'next/server'
import { Client, Storage, Databases, ID } from 'node-appwrite'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'
const STORAGE_BUCKET = 'card_images'
const META_MARKER = '##BIZCARD_IMAGES##'

export const runtime = 'nodejs'
export const maxDuration = 30

function getClient() {
  return new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(PROJECT_ID).setKey(process.env.APPWRITE_API_KEY || '')
}

// Store images in raw_text: original_raw_text + META_MARKER + JSON
function getImages(rawText: string): any[] {
  if (!rawText) return []
  const idx = rawText.indexOf(META_MARKER)
  if (idx === -1) return []
  try { return JSON.parse(rawText.slice(idx + META_MARKER.length)) } catch { return [] }
}
function getCleanRawText(rawText: string): string {
  if (!rawText) return ''
  const idx = rawText.indexOf(META_MARKER)
  return idx === -1 ? rawText : rawText.slice(0, idx)
}
function setImages(rawText: string, images: any[]): string {
  const clean = getCleanRawText(rawText)
  if (!images.length) return clean
  return clean + META_MARKER + JSON.stringify(images)
}

// POST - add image
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const cardId = formData.get('cardId') as string
    const label = (formData.get('label') as string) || ''
    if (!file || !cardId) return NextResponse.json({ error: 'file and cardId required' }, { status: 400 })

    const client = getClient()
    const storage = new Storage(client)
    const uploaded = await storage.createFile(STORAGE_BUCKET, ID.unique(), file)
    const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${uploaded.bucketId}/files/${uploaded.$id}/view?project=${PROJECT_ID}&mode=admin`

    const databases = new Databases(client)
    const card = await databases.getDocument(DATABASE_ID, CARDS_COLLECTION, cardId)
    const images = getImages(card.raw_text || '')
    images.push({ url: fileUrl, label: label || null, added_at: new Date().toISOString() })

    await databases.updateDocument(DATABASE_ID, CARDS_COLLECTION, cardId, {
      raw_text: setImages(card.raw_text || '', images),
      image_url: card.image_url || fileUrl,
      lastModified: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, image: images[images.length-1] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// DELETE - remove image
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cardId = searchParams.get('cardId')
    const imageUrl = searchParams.get('imageUrl')
    if (!cardId || !imageUrl) return NextResponse.json({ error: 'cardId and imageUrl required' }, { status: 400 })

    const client = getClient()
    const databases = new Databases(client)
    const card = await databases.getDocument(DATABASE_ID, CARDS_COLLECTION, cardId)
    const images = getImages(card.raw_text || '')
    const filtered = images.filter((img: any) => img.url !== imageUrl)

    const updates: any = {
      raw_text: setImages(card.raw_text || '', filtered),
      lastModified: new Date().toISOString(),
    }
    if (card.image_url === imageUrl) updates.image_url = filtered[0]?.url || null

    await databases.updateDocument(DATABASE_ID, CARDS_COLLECTION, cardId, updates)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// PATCH - set cover
export async function PATCH(req: NextRequest) {
  try {
    const { cardId, imageUrl } = await req.json()
    if (!cardId || !imageUrl) return NextResponse.json({ error: 'cardId and imageUrl required' }, { status: 400 })

    const client = getClient()
    const databases = new Databases(client)
    await databases.updateDocument(DATABASE_ID, CARDS_COLLECTION, cardId, {
      image_url: imageUrl, lastModified: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

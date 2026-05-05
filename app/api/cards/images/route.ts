import { NextRequest, NextResponse } from 'next/server'
import { Client, Storage, Databases, ID } from 'node-appwrite'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'
const STORAGE_BUCKET = 'card_images'
const META_DELIMITER = '__bizcard_meta__'

export const runtime = 'nodejs'
export const maxDuration = 30

function getClient() {
  return new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(PROJECT_ID).setKey(process.env.APPWRITE_API_KEY || '')
}

// Parse and strip metadata from notes field
function stripMeta(notes: string): { text: string; images: any[]; profile_pic?: string; linkedin?: string } {
  if (!notes) return { text: '', images: [] }
  const idx = notes.indexOf(META_DELIMITER)
  if (idx === -1) return { text: notes, images: [] }
  try {
    const meta = JSON.parse(notes.slice(idx + META_DELIMITER.length))
    return { text: notes.slice(0, idx), images: meta._i || [], profile_pic: meta._pp, linkedin: meta._li }
  } catch { return { text: notes.slice(0, Math.max(0, idx - 1)), images: [] } }
}

// Encode metadata into notes
function encodeMeta(text: string, images: any[], profilePic?: string, linkedin?: string): string {
  const meta: any = {}
  if (images.length) meta._i = images
  if (profilePic) meta._pp = profilePic
  if (linkedin) meta._li = linkedin
  if (Object.keys(meta).length === 0) return text
  return (text || '') + META_DELIMITER + JSON.stringify(meta)
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
    const { text, images, profile_pic, linkedin } = stripMeta(card.notes || '')
    images.push({ url: fileUrl, label: label || null, added_at: new Date().toISOString() })

    await databases.updateDocument(DATABASE_ID, CARDS_COLLECTION, cardId, {
      notes: encodeMeta(text, images, profile_pic || card.profile_pic_url, linkedin || card.linkedin_url),
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
    const { text, images, profile_pic, linkedin } = stripMeta(card.notes || '')
    const filtered = images.filter((img: any) => img.url !== imageUrl)

    const updates: any = {
      notes: encodeMeta(text, filtered, profile_pic, linkedin),
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
      image_url: imageUrl,
      lastModified: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

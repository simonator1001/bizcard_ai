import { NextRequest, NextResponse } from 'next/server'
import { Client, Storage, Databases, ID } from 'node-appwrite'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'
const STORAGE_BUCKET = 'card_images'

export const runtime = 'nodejs'
export const maxDuration = 30

function getClient() {
  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || '')
}

// POST /api/cards/images — add an image to a card
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const cardId = formData.get('cardId') as string
    const label = (formData.get('label') as string) || ''

    if (!file || !cardId) {
      return NextResponse.json({ error: 'file and cardId are required' }, { status: 400 })
    }

    // Upload to AppWrite Storage
    const client = getClient()
    const storage = new Storage(client)
    const uploaded = await storage.createFile(STORAGE_BUCKET, ID.unique(), file)

    const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${uploaded.bucketId}/files/${uploaded.$id}/view?project=${PROJECT_ID}&mode=admin`

    // Read current card images
    const databases = new Databases(client)
    const card = await databases.getDocument(DATABASE_ID, CARDS_COLLECTION, cardId)
    const existingImages = (card.images as any[]) || []

    const newImage = { url: fileUrl, label: label || null, added_at: new Date().toISOString() }

    // If no cover image set, use this as cover
    const updates: any = {
      images: [...existingImages, newImage],
      lastModified: new Date().toISOString(),
    }
    if (!card.image_url) {
      updates.image_url = fileUrl
    }

    await databases.updateDocument(DATABASE_ID, CARDS_COLLECTION, cardId, updates)

    return NextResponse.json({ success: true, image: newImage, cover_url: fileUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/cards/images?cardId=...&imageUrl=... — remove an image
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cardId = searchParams.get('cardId')
    const imageUrl = searchParams.get('imageUrl')

    if (!cardId || !imageUrl) {
      return NextResponse.json({ error: 'cardId and imageUrl required' }, { status: 400 })
    }

    const client = getClient()
    const databases = new Databases(client)
    const card = await databases.getDocument(DATABASE_ID, CARDS_COLLECTION, cardId)
    const existingImages = (card.images as any[]) || []

    const filtered = existingImages.filter((img: any) => img.url !== imageUrl)
    const updates: any = { images: filtered, lastModified: new Date().toISOString() }

    // If cover image was removed, set new cover
    if (card.image_url === imageUrl) {
      updates.image_url = filtered.length > 0 ? filtered[0].url : null
    }

    await databases.updateDocument(DATABASE_ID, CARDS_COLLECTION, cardId, updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/cards/images — set cover image
export async function PATCH(req: NextRequest) {
  try {
    const { cardId, imageUrl } = await req.json()

    if (!cardId || !imageUrl) {
      return NextResponse.json({ error: 'cardId and imageUrl required' }, { status: 400 })
    }

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

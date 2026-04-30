import { NextApiRequest, NextApiResponse } from 'next'
import { Client, Storage, Databases, ID, Permission, Role } from 'node-appwrite'
import { recognizeBusinessCard } from '@/lib/ocr-service'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    maxDuration: 60, // 60 seconds for Vercel Pro
  },
}

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = '69efa226000db23fcd89'
const DATABASE_ID = 'bizcard_ai'
const CARDS_COLLECTION = 'business_cards'
const STORAGE_BUCKET = 'card_images'

function appwriteHeaders() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  }
}

function getAppWriteClient(): Client {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || '')
  return client
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, userId } = req.body

    if (!image) {
      return res.status(400).json({ error: 'No image provided' })
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' })
    }

    console.log('[SCAN] Image received, size:', Math.ceil(image.length / 1024), 'KB')
    console.log('[SCAN] User ID:', userId)

    // Step 1: Perform OCR directly (inline instead of HTTP call to avoid double timeout)
    console.log('[SCAN] Running OCR recognition...')
    let ocrResult
    try {
      ocrResult = await recognizeBusinessCard(image)
      console.log('[SCAN] OCR successful')
    } catch (ocrError: any) {
      console.error('[SCAN] OCR failed:', ocrError.message)
      return res.status(502).json({ error: 'OCR processing failed', message: ocrError.message })
    }

    // Step 2: Upload image to AppWrite Storage
    console.log('[SCAN] Uploading image to AppWrite Storage...')
    const imageUrl = await uploadImageToAppWrite(userId, image)
    console.log('[SCAN] Image uploaded:', imageUrl)

    // Step 3: Save card to AppWrite Database
    console.log('[SCAN] Saving card to AppWrite Database...')
    const cardData = {
      user_id: userId,
      name: ocrResult.words_result?.NAME?.words || '',
      name_zh: ocrResult.words_result?.NAME_ZH?.words || '',
      company: ocrResult.words_result?.COMPANY?.words || '[No Company]',
      company_zh: ocrResult.words_result?.COMPANY_ZH?.words || '',
      title: ocrResult.words_result?.TITLE?.words || '',
      title_zh: ocrResult.words_result?.TITLE_ZH?.words || '',
      email: ocrResult.words_result?.EMAIL?.words || '',
      phone: (ocrResult.words_result?.MOBILE?.words || '').replace(/\s+/g, ' ').trim().substring(0, 50),
      address: ocrResult.words_result?.ADDR?.words || '',
      address_zh: ocrResult.words_result?.ADDR_ZH?.words || '',
      image_url: imageUrl,
      raw_text: ocrResult.raw_text || '',
      lastModified: new Date().toISOString(),
    }

    const docId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const createRes = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${CARDS_COLLECTION}/documents`,
      {
        method: 'POST',
        headers: appwriteHeaders(),
        body: JSON.stringify({
          documentId: docId,
          data: cardData,
          permissions: [
            `read(\"user:${userId}\")`,
            `update(\"user:${userId}\")`,
            `delete(\"user:${userId}\")`,
          ],
        }),
      }
    )

    const createResult = await createRes.json()
    if (!createRes.ok) {
      console.error('[SCAN] Database insert failed:', createResult)
      return res.status(500).json({
        error: 'Failed to save card',
        details: createResult.message || 'Database error',
      })
    }

    console.log('[SCAN] Card saved successfully:', docId)

    // Return the saved card
    return res.status(200).json({
      id: docId,
      ...cardData,
      $id: docId,
    })

  } catch (error: any) {
    console.error('[SCAN] Error:', error.message)
    return res.status(500).json({
      error: 'Failed to process business card',
      message: error.message,
    })
  }
}

async function uploadImageToAppWrite(userId: string, base64Image: string): Promise<string> {
  const base64Data = base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image

  const buffer = Buffer.from(base64Data, 'base64')
  const fileName = `card_${Date.now().toString(36)}_${Math.random().toString(36).substr(2,6)}.jpg`

  const client = getAppWriteClient()
  const storage = new Storage(client)

  // AppWrite SDK handles multipart internally — pass the Buffer directly
  const file = await storage.createFile(
    STORAGE_BUCKET,
    ID.unique(),
    new File([buffer], fileName, { type: 'image/jpeg' }),
    [Permission.read(Role.user(userId))]
  )

  console.log('[SCAN] File uploaded:', file.$id)

  // Return the view URL
  return `${APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET}/files/${file.$id}/view?project=${PROJECT_ID}`
}

import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { TOGETHER_API_KEY, VISION_MODEL } from '@/lib/ocr-config'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageBase64 } = req.body

    console.log('[Test OCR] Starting API test...')
    console.log('[Test OCR] API Key present:', !!TOGETHER_API_KEY)
    console.log('[Test OCR] Model:', VISION_MODEL)

    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What text can you see in this business card image? Just list the text you see."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000
      }
    )

    console.log('[Test OCR] Raw API Response:', response.data)

    return res.status(200).json({
      success: true,
      data: response.data
    })

  } catch (error: any) {
    console.error('[Test OCR] Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    })

    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    })
  }
} 
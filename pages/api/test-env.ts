import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    hasKey: !!process.env.PERPLEXITY_API_KEY,
    // Don't expose the actual key in production!
    keyPreview: process.env.PERPLEXITY_API_KEY ? 'Present' : 'Missing'
  })
} 
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Simply returns a pre-built Google search URL for the user to find the LinkedIn profile
export async function POST(req: NextRequest) {
  try {
    const { name, company } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const query = `${name} ${company || ''} linkedin`.trim()
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`

    return NextResponse.json({
      success: true,
      googleSearchUrl,
      message: `Search Google for "${query}" and paste the LinkedIn URL`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

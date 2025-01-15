import dotenv from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Initialize Supabase API URL and key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

async function setupRLSAPI() {
  try {
    // Create RLS API endpoint
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey!}`,
      'apikey': supabaseKey!
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/setup_rls_api`, {
      method: 'POST',
      headers
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to setup RLS API: ${error}`)
    }

    console.log('RLS API setup completed successfully')
  } catch (error) {
    console.error('Error setting up RLS API:', error)
    process.exit(1)
  }
}

setupRLSAPI() 
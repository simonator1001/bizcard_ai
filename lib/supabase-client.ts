import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Add the test connection function
export async function testSupabaseConnection() {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('business_cards')
      .select('count')
      .limit(1)
    
    if (connectionError) throw connectionError;

    // Test auth service
    const { data: authTest, error: authError } = await supabase.auth.getSession()
    if (authError) throw authError;

    // Return test results
    return {
      connection: true,
      auth: true,
      data: {
        connection: connectionTest,
        auth: authTest
      }
    }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return {
      connection: false,
      auth: false,
      error
    }
  }
}

// Type for database business card
export interface DatabaseBusinessCard {
  id: string
  user_id: string
  name: string
  name_zh: string | null
  company: string
  company_zh: string | null
  title: string
  title_zh: string | null
  email: string
  phone: string
  address: string | null
  address_zh: string | null
  image_url: string
  raw_text: string | null
  created_at: string
  updated_at: string
} 
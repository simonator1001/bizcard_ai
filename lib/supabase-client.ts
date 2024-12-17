import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-client'
    },
    fetch: fetch.bind(globalThis) // Ensure fetch is bound correctly
  }
})

// Add error handling and retry logic
export async function fetchWithRetry(
  operation: () => Promise<any>,
  retries = 3,
  delay = 1000
) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

export const getAuthUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    if (!session?.user) {
      return null
    }

    return session.user
  } catch (error) {
    console.error('Auth status check error:', error)
    return null
  }
}

export const debugAuthToken = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Session error:', error)
    return
  }
  if (session?.access_token) {
    const [header, payload, signature] = session.access_token.split('.')
    console.log('JWT Payload:', JSON.parse(atob(payload)))
  }
}

export const debugBusinessCards = async () => {
  const { data, error } = await supabase
    .from('business_cards')
    .select(`
      id,
      name,
      title,
      title_zh,
      company,
      company_zh,
      email,
      phone,
      created_at,
      updated_at
    `)
    .order('company', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching business cards:', error);
    return;
  }

  console.table(data);
  return data;
}; 

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('business_cards').select('count').single()
    
    if (error) {
      console.error('Supabase connection check failed:', error)
      return false
    }
    
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection check failed:', error)
    return false
  }
}
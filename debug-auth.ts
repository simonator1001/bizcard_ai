import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for debugging
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to get user by email
async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

// Function to get user's subscription
async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }

  return data
}

export { getUserByEmail, getUserSubscription } 
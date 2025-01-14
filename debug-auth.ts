const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key for debugging
const supabaseUrl = 'https://supabase.simon-gpt.com'
const supabaseServiceKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTczMjYwMDg2MCwiZXhwIjo0ODg4Mjc0NDYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.WQXqcz3zsp7ee_M-BkEnPkdRliKB9WeNYjWz7Mp5_6g'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface User {
  id: string
  email: string
}

interface BusinessCard {
  id: string
  user_id: string
  name: string
  email: string
}

interface SubscriptionUsage {
  id: string
  user_id: string
  month: string
  scans_count: number
  companies_tracked: number
  total_cards: number
}

async function debugAuth() {
  console.log('Debugging Authentication and Data Access\n')

  // 1. Check business_cards table
  console.log('1. Checking business_cards table')
  const { data: cards, error: cardsError } = await supabase
    .from('business_cards')
    .select('*')
  
  if (cardsError) {
    console.log('Error querying cards:', cardsError.message)
  } else {
    console.log('Total cards:', cards?.length || 0)
    if (cards?.length > 0) {
      const uniqueUserIds = new Set(cards.map((c: BusinessCard) => c.user_id))
      console.log('Number of unique user_ids:', uniqueUserIds.size)
      console.log('Sample of unique user_ids:', Array.from(uniqueUserIds).slice(0, 5))
    }
  }
  console.log('\n')

  // 2. Check subscription_usage
  console.log('2. Checking subscription_usage table')
  const { data: usage, error: usageError } = await supabase
    .from('subscription_usage')
    .select('*')
  
  if (usageError) {
    console.log('Error querying usage:', usageError.message)
  } else {
    console.log('Total usage records:', usage?.length || 0)
    if (usage?.length > 0) {
      const uniqueUserIds = new Set(usage.map((u: SubscriptionUsage) => u.user_id))
      console.log('Number of unique user_ids in usage:', uniqueUserIds.size)
      console.log('Sample of unique user_ids:', Array.from(uniqueUserIds).slice(0, 5))
    }
  }
  console.log('\n')

  // 3. Check specific user's data
  const userEmail = 'simon.ckchow@gmail.com'
  console.log(`3. Checking data for ${userEmail}`)
  
  // First get user's cards
  const { data: userCards, error: userCardsError } = await supabase
    .from('business_cards')
    .select('*')
    .eq('user_id', '1')
  
  console.log(`Cards for user_id=1:`, userCards?.length || 0)
  if (userCardsError) console.log('Error:', userCardsError.message)
  
  // Also try with user_id=48aca257-6d9e-46de-96aa-319fa5dcfbdf
  const { data: userCards2, error: userCards2Error } = await supabase
    .from('business_cards')
    .select('*')
    .eq('user_id', '48aca257-6d9e-46de-96aa-319fa5dcfbdf')
  
  console.log(`Cards for user_id=48aca...:`, userCards2?.length || 0)
  if (userCards2Error) console.log('Error:', userCards2Error.message)
}

debugAuth().catch(console.error) 
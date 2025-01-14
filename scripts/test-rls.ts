const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create service client
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    // Test RLS policies
    console.log('Testing RLS policies...');

    // 1. Get total count of business cards
    const { count: totalCount, error: countError } = await serviceClient
      .from('business_cards')
      .select('*', { count: 'exact', head: true });

    console.log('Total cards in database:', totalCount);
    if (countError) console.error('Error getting total count:', countError);

    // 2. Get cards for specific user
    const userId = '5b888a04-79a4-4c96-bf2d-2c97f1ed0ccf';
    const { data: userCards, error: userCardsError } = await serviceClient
      .from('business_cards')
      .select('*')
      .eq('user_id', userId);

    console.log(`Cards for user ${userId}:`, userCards?.length);
    if (userCardsError) console.error('Error getting user cards:', userCardsError);

    // 3. Check RLS policies
    const { data: policies, error: policiesError } = await serviceClient.rpc('get_policies', {
      table_name: 'business_cards'
    });

    console.log('RLS Policies:', policies);
    if (policiesError) console.error('Error getting policies:', policiesError);

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
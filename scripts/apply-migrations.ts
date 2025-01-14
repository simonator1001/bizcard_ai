const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase service client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  try {
    // Check if RLS is already enabled
    console.log('Checking RLS status...');
    const { data: cards, error: checkError } = await supabase
      .from('business_cards')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('Error checking RLS:', checkError);
      return;
    }

    // Enable RLS
    console.log('Enabling RLS...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('business_cards')
      .select('*')
      .limit(1)
      .then(async () => {
        return await supabase
          .from('business_cards')
          .select('*')
          .eq('id', 'ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY');
      });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
      return;
    }

    // Create policies
    const policies = [
      {
        name: 'read_own_cards',
        sql: `
          DROP POLICY IF EXISTS read_own_cards ON business_cards;
          CREATE POLICY read_own_cards ON business_cards
            FOR SELECT USING (auth.uid() = user_id);
        `
      },
      {
        name: 'insert_own_cards',
        sql: `
          DROP POLICY IF EXISTS insert_own_cards ON business_cards;
          CREATE POLICY insert_own_cards ON business_cards
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'update_own_cards',
        sql: `
          DROP POLICY IF EXISTS update_own_cards ON business_cards;
          CREATE POLICY update_own_cards ON business_cards
            FOR UPDATE USING (auth.uid() = user_id);
        `
      },
      {
        name: 'delete_own_cards',
        sql: `
          DROP POLICY IF EXISTS delete_own_cards ON business_cards;
          CREATE POLICY delete_own_cards ON business_cards
            FOR DELETE USING (auth.uid() = user_id);
        `
      }
    ];

    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name}`);
      const { data: policyData, error: policyError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', policy.sql);

      if (policyError) {
        console.error(`Error creating policy ${policy.name}:`, policyError);
      }
    }

    // Verify policies
    console.log('Verifying policies...');
    const { data: currentPolicies, error: verifyError } = await supabase
      .from('business_cards')
      .select('*')
      .eq('id', `
        SELECT *
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'business_cards';
      `);

    if (verifyError) {
      console.error('Error verifying policies:', verifyError);
    } else {
      console.log('Current policies:', currentPolicies);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 
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

// Create Supabase service client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  try {
    // Check if RLS is already enabled
    console.log('Checking RLS status...');
    const { data: cards, error: cardsError } = await supabase
      .from('business_cards')
      .select('*')
      .limit(1);

    if (cardsError) {
      console.error('Error checking RLS:', cardsError);
      return;
    }

    console.log('RLS check succeeded:', cards);

    // Enable RLS
    console.log('\nEnabling RLS...');
    const { data: enableRlsData, error: enableRlsError } = await supabase
      .from('business_cards')
      .select('*')
      .limit(1)
      .then(async () => {
        return await supabase.rpc('alter_table_enable_rls', {
          table_name: 'business_cards'
        });
      });
    
    if (enableRlsError) {
      console.error('Error enabling RLS:', enableRlsError);
    } else {
      console.log('RLS enabled successfully');
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
      console.log(`\nCreating policy: ${policy.name}`);
      const { data: policyData, error: policyError } = await supabase
        .from('business_cards')
        .select('*')
        .limit(1)
        .then(async () => {
          return await supabase.rpc('create_policy', {
            table_name: 'business_cards',
            policy_name: policy.name,
            policy_sql: policy.sql
          });
        });
      
      if (policyError) {
        console.error(`Error creating policy ${policy.name}:`, policyError);
      } else {
        console.log(`Policy ${policy.name} created successfully`);
      }
    }

    // Verify policies
    console.log('\nVerifying policies...');
    const { data: policiesData, error: policiesError } = await supabase
      .from('business_cards')
      .select('*')
      .limit(1)
      .then(async () => {
        return await supabase.rpc('get_table_policies', {
          table_name: 'business_cards'
        });
      });
    
    if (policiesError) {
      console.error('Error verifying policies:', policiesError);
    } else {
      console.log('Current policies:', policiesData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
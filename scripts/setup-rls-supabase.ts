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
    // First, check if RLS is already enabled
    const { data: rlsEnabled, error: rlsError } = await serviceClient
      .from('business_cards')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.log('RLS check failed, proceeding with setup:', rlsError.message);
    } else {
      console.log('RLS check succeeded, current state:', rlsEnabled);
    }

    // Enable RLS using raw SQL
    const { error: enableRlsError } = await serviceClient
      .from('_sql')
      .select('*')
      .eq('query', 'ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;');

    if (enableRlsError) {
      console.error('Error enabling RLS:', enableRlsError);
    } else {
      console.log('RLS enabled successfully');
    }

    // Create policies using raw SQL
    const policies = [
      {
        name: 'read_own_cards',
        sql: `
          DROP POLICY IF EXISTS read_own_cards ON business_cards;
          CREATE POLICY read_own_cards ON business_cards
            FOR SELECT
            USING (auth.uid() = user_id);
        `
      },
      {
        name: 'insert_own_cards',
        sql: `
          DROP POLICY IF EXISTS insert_own_cards ON business_cards;
          CREATE POLICY insert_own_cards ON business_cards
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'update_own_cards',
        sql: `
          DROP POLICY IF EXISTS update_own_cards ON business_cards;
          CREATE POLICY update_own_cards ON business_cards
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'delete_own_cards',
        sql: `
          DROP POLICY IF EXISTS delete_own_cards ON business_cards;
          CREATE POLICY delete_own_cards ON business_cards
            FOR DELETE
            USING (auth.uid() = user_id);
        `
      }
    ];

    for (const policy of policies) {
      console.log(`\nCreating policy: ${policy.name}`);
      const { error: policyError } = await serviceClient
        .from('_sql')
        .select('*')
        .eq('query', policy.sql);

      if (policyError) {
        console.error(`Error creating policy ${policy.name}:`, policyError);
      } else {
        console.log(`Policy ${policy.name} created successfully`);
      }
    }

    // Verify policies using raw SQL
    const { data: verifyData, error: verifyError } = await serviceClient
      .from('_sql')
      .select('*')
      .eq('query', `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'business_cards';
      `);

    if (verifyError) {
      console.error('Error verifying policies:', verifyError);
    } else {
      console.log('Current policies:', verifyData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
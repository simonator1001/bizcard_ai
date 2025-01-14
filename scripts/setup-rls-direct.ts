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
const client = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    // First, check if RLS is already enabled
    const { data: rlsEnabled, error: rlsError } = await client
      .from('business_cards')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.log('RLS check failed, proceeding with setup:', rlsError.message);
    } else {
      console.log('RLS check succeeded, current state:', rlsEnabled);
    }

    // Enable RLS
    const { error: enableRlsError } = await client
      .from('business_cards')
      .select('*')
      .limit(1)
      .then(async () => {
        return await client.rpc('execute_sql', {
          statement: 'ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;'
        });
      });

    if (enableRlsError) {
      console.error('Error enabling RLS:', enableRlsError);
      return;
    }

    console.log('RLS enabled successfully');

    // Create policies
    const policies = [
      {
        name: 'read_own_cards',
        statement: `
          DROP POLICY IF EXISTS read_own_cards ON business_cards;
          CREATE POLICY read_own_cards ON business_cards
            FOR SELECT
            USING (auth.uid() = user_id);
        `
      },
      {
        name: 'insert_own_cards',
        statement: `
          DROP POLICY IF EXISTS insert_own_cards ON business_cards;
          CREATE POLICY insert_own_cards ON business_cards
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'update_own_cards',
        statement: `
          DROP POLICY IF EXISTS update_own_cards ON business_cards;
          CREATE POLICY update_own_cards ON business_cards
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'delete_own_cards',
        statement: `
          DROP POLICY IF EXISTS delete_own_cards ON business_cards;
          CREATE POLICY delete_own_cards ON business_cards
            FOR DELETE
            USING (auth.uid() = user_id);
        `
      }
    ];

    for (const policy of policies) {
      console.log(`\nCreating policy: ${policy.name}`);
      const { error: policyError } = await client
        .from('business_cards')
        .select('*')
        .limit(1)
        .then(async () => {
          return await client.rpc('execute_sql', {
            statement: policy.statement
          });
        });

      if (policyError) {
        console.error(`Error creating policy ${policy.name}:`, policyError);
      } else {
        console.log(`Policy ${policy.name} created successfully`);
      }
    }

    // Verify the policies are in place
    const { data: verifyData, error: verifyError } = await client
      .from('business_cards')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log('RLS policies are active:', verifyError.message);
    } else {
      console.warn('WARNING: RLS policies might not be active - able to read without auth');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
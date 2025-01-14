const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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
    // Read migration file
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20240113_enable_rls.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Split migration into individual statements
    const statements = migration
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log('\nExecuting statement:', statement);
      
      const { data, error } = await serviceClient.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        console.error('Error executing statement:', error);
      } else {
        console.log('Statement executed successfully');
      }
    }

    // Verify RLS is enabled
    const { data: rlsData, error: rlsError } = await serviceClient.rpc('check_rls', {
      table_name: 'business_cards'
    });

    if (rlsError) {
      console.error('Error checking RLS:', rlsError);
    } else {
      console.log('\nRLS status:', rlsData);
    }

    // Verify policies
    const { data: policiesData, error: policiesError } = await serviceClient.rpc('get_policies', {
      table_name: 'business_cards'
    });

    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.log('\nCurrent policies:', policiesData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
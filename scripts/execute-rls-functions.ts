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
    // Read SQL functions
    const sql = fs.readFileSync(path.resolve(__dirname, 'create-rls-functions.sql'), 'utf8');
    
    // Execute SQL functions
    const { error: functionsError } = await serviceClient.rpc('exec_sql', {
      sql_query: sql
    });

    if (functionsError) {
      console.error('Error creating functions:', functionsError);
      return;
    }

    console.log('SQL functions created successfully');

    // Now execute each function
    const functions = [
      'enable_rls_on_business_cards',
      'create_read_policy',
      'create_insert_policy',
      'create_update_policy',
      'create_delete_policy'
    ];

    for (const func of functions) {
      console.log(`\nExecuting ${func}...`);
      const { error } = await serviceClient.rpc(func);
      
      if (error) {
        console.error(`Error executing ${func}:`, error);
      } else {
        console.log(`${func} executed successfully`);
      }
    }

    // Verify policies
    console.log('\nVerifying policies...');
    const { data: policies, error: policiesError } = await serviceClient.rpc('get_policies', {
      table_name: 'business_cards'
    });

    if (policiesError) {
      console.error('Error getting policies:', policiesError);
    } else {
      console.log('Current policies:', policies);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
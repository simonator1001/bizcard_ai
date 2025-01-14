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
    // Read SQL queries
    const sql = fs.readFileSync(path.resolve(__dirname, 'check-policies.sql'), 'utf8');
    const queries = sql.split(';').filter((q: string) => q.trim());

    // Execute each query
    for (const query of queries) {
      console.log('\nExecuting query:', query.trim());
      const { data, error } = await serviceClient.rpc('exec_sql', {
        sql_query: query.trim()
      });

      if (error) {
        console.error('Error executing query:', error);
      } else {
        console.log('Result:', data);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
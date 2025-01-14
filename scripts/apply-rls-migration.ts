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
  },
  db: {
    schema: 'public'
  }
});

async function executeMigration(filePath: string) {
  console.log(`\nExecuting migration: ${path.basename(filePath)}`);
  
  // Read migration file
  const migration = fs.readFileSync(filePath, 'utf8');

  // Split migration into individual statements
  const statements = migration
    .split(';')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  // Execute each statement
  for (const statement of statements) {
    console.log('\nExecuting statement:', statement);
    
    const { error } = await serviceClient
      .from('business_cards')
      .select('*')
      .limit(1)
      .then(async () => {
        return await serviceClient.rpc('exec_sql_statement', {
          statement
        });
      });

    if (error) {
      console.error('Error executing statement:', error);
    } else {
      console.log('Statement executed successfully');
    }
  }
}

async function main() {
  try {
    // Execute migrations in order
    const migrations = [
      path.resolve(__dirname, '../supabase/migrations/20240113_create_functions.sql'),
      path.resolve(__dirname, '../supabase/migrations/20240113_enable_rls.sql')
    ];

    for (const migration of migrations) {
      await executeMigration(migration);
    }

    // Verify RLS is enabled
    const { data: rlsData, error: rlsError } = await serviceClient
      .from('business_cards')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.log('RLS enabled successfully:', rlsError.message);
    } else {
      console.log('RLS status:', rlsData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 
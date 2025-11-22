import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyRLSMigration() {
  try {
    // Enable RLS
    console.log('Enabling RLS...')
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;'
    })

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
    ]

    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name}`)
      await supabase.rpc('exec_sql', { sql: policy.sql })
    }

    console.log('RLS migration completed successfully')
  } catch (error) {
    console.error('Error applying RLS migration:', error)
    process.exit(1)
  }
}

applyRLSMigration() 
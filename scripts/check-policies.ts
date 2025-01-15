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

async function checkPolicies() {
  try {
    // Check RLS status
    console.log('Checking RLS status...')
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = 'business_cards'::regclass;
      `
    })

    if (rlsError) {
      console.error('Error checking RLS status:', rlsError)
      return
    }

    console.log('RLS status:', rlsStatus)

    // Check policies
    console.log('\nChecking policies...')
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT *
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'business_cards';
      `
    })

    if (policiesError) {
      console.error('Error checking policies:', policiesError)
      return
    }

    console.log('Current policies:', policies)
  } catch (error) {
    console.error('Error checking policies:', error)
    process.exit(1)
  }
}

checkPolicies() 
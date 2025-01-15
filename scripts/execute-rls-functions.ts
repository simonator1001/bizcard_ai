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

async function executeRLSFunctions() {
  try {
    // Execute RLS functions
    const functions = [
      {
        name: 'check_rls',
        sql: `
          CREATE OR REPLACE FUNCTION check_rls(table_name text)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            rls_enabled boolean;
          BEGIN
            SELECT relrowsecurity INTO rls_enabled
            FROM pg_class
            WHERE oid = table_name::regclass;
            RETURN rls_enabled;
          END;
          $$;
        `
      },
      {
        name: 'get_policies',
        sql: `
          CREATE OR REPLACE FUNCTION get_policies(table_name text)
          RETURNS json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            policies json;
          BEGIN
            SELECT json_agg(row_to_json(p))
            INTO policies
            FROM pg_policies p
            WHERE p.schemaname = 'public'
              AND p.tablename = table_name;
            RETURN policies;
          END;
          $$;
        `
      }
    ]

    for (const func of functions) {
      console.log(`Creating function: ${func.name}`)
      const { error } = await supabase.rpc('exec_sql', { sql: func.sql })

      if (error) {
        console.error(`Error creating function ${func.name}:`, error)
        process.exit(1)
      }

      console.log(`Function ${func.name} created successfully`)
    }

    console.log('All RLS functions created successfully')
  } catch (error) {
    console.error('Error executing RLS functions:', error)
    process.exit(1)
  }
}

executeRLSFunctions() 
// Script to check and fix RLS policies for business card tables
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Main function to fix RLS policies using direct SQL execution
async function fixRlsPolicies() {
  console.log('Applying RLS policy fixes...');

  try {
    // SQL commands to fix all RLS issues
    const sql = `
      -- Create the user_usage_stats table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.user_usage_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        scans_this_month INTEGER DEFAULT 0,
        unique_companies INTEGER DEFAULT 0,
        cards_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS on the business_cards table if it exists
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'business_cards'
        ) THEN
          ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;
        END IF;
      END $$;

      -- Enable RLS on the user_usage_stats table
      ALTER TABLE public.user_usage_stats ENABLE ROW LEVEL SECURITY;

      -- Enable RLS on the subscriptions table if it exists
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'subscriptions'
        ) THEN
          ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
        END IF;
      END $$;

      -- Drop existing policies for business_cards if the table exists
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'business_cards'
        ) THEN
          DROP POLICY IF EXISTS "Users can view their own business cards" ON public.business_cards;
          DROP POLICY IF EXISTS "Users can insert their own business cards" ON public.business_cards;
          DROP POLICY IF EXISTS "Users can update their own business cards" ON public.business_cards;
          DROP POLICY IF EXISTS "Users can delete their own business cards" ON public.business_cards;
          DROP POLICY IF EXISTS "Service role can access all business cards" ON public.business_cards;
          
          -- Create policies for business_cards table
          CREATE POLICY "Users can view their own business cards"
          ON public.business_cards
          FOR SELECT
          USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert their own business cards"
          ON public.business_cards
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own business cards"
          ON public.business_cards
          FOR UPDATE
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can delete their own business cards"
          ON public.business_cards
          FOR DELETE
          USING (auth.uid() = user_id);
          
          CREATE POLICY "Service role can access all business cards"
          ON public.business_cards
          USING (true)
          WITH CHECK (true);
        END IF;
      END $$;

      -- Create policies for user_usage_stats table
      DROP POLICY IF EXISTS "Users can view their own usage stats" ON public.user_usage_stats;
      DROP POLICY IF EXISTS "Service role can manage usage stats" ON public.user_usage_stats;

      -- Allow users to select their own usage stats
      CREATE POLICY "Users can view their own usage stats"
      ON public.user_usage_stats
      FOR SELECT
      USING (auth.uid() = user_id);

      -- Allow service role to manage usage stats
      CREATE POLICY "Service role can manage usage stats"
      ON public.user_usage_stats
      USING (true)
      WITH CHECK (true);

      -- Fix subscriptions table if it exists
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'subscriptions'
        ) THEN
          DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
          DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
          
          CREATE POLICY "Users can view their own subscription"
          ON public.subscriptions
          FOR SELECT
          USING (auth.uid() = user_id);
          
          CREATE POLICY "Service role can manage subscriptions"
          ON public.subscriptions
          USING (true)
          WITH CHECK (true);
        END IF;
      END $$;
    `;

    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying RLS fixes:', error);
      return;
    }
    
    console.log('RLS policies fixed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Create a utility function to execute SQL
async function createExecSqlFunction() {
  try {
    // Try to use the function to see if it exists
    const { error: testError } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT 1;' 
    });
    
    if (!testError) {
      console.log('exec_sql function exists');
      return true;
    }
    
    console.log('Creating exec_sql function...');
    
    // Make a direct request to create the function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating exec_sql function:', errorText);
      
      // Try alternative method using direct SQL
      console.log('Trying alternative method to create exec_sql function...');
      
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // Create a custom query to execute raw SQL
      const { error } = await supabase.from('_exec_sql_setup').select().limit(1).then(() => ({})).catch(async () => {
        // Make a custom query to create the function
        const rawResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: createFunctionSql
          })
        });
        
        if (!rawResponse.ok) {
          return { error: new Error(`Failed to create function: ${await rawResponse.text()}`) };
        }
        
        return {};
      });
      
      if (error) {
        console.error('Failed to create exec_sql function:', error);
        return false;
      }
    }
    
    console.log('exec_sql function created successfully');
    return true;
  } catch (error) {
    console.error('Error setting up exec_sql function:', error);
    return false;
  }
}

// Initialize and run
async function main() {
  try {
    // First try to establish the SQL execution function
    const setupSuccess = await createExecSqlFunction();
    
    if (setupSuccess) {
      // Fix the RLS policies
      await fixRlsPolicies();
    } else {
      console.log('Could not set up exec_sql function. Using Supabase SQL Editor instead.');
      console.log('Please run the SQL script in scripts/fix-rls.sql manually in the Supabase SQL Editor.');
    }
    
    console.log('Done');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main(); 
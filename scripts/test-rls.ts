import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create clients with different roles
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRLSPolicies() {
  try {
    console.log('Testing RLS policies...');

    // Test 1: Insert with service role (should succeed)
    console.log('\nTest 1: Insert with service role');
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('business_cards')
      .insert([{
        user_id: 'test-user',
        name: 'Test Card',
        company: 'Test Company',
        title: 'Test Title',
        email: 'test@example.com'
      }])
      .select()
      .single();

    if (serviceError) {
      console.error('Service role insert failed:', serviceError);
    } else {
      console.log('Service role insert succeeded:', serviceData.id);
    }

    // Test 2: Insert with anon role (should fail)
    console.log('\nTest 2: Insert with anon role');
    const { error: anonError } = await anonClient
      .from('business_cards')
      .insert([{
        user_id: 'test-user',
        name: 'Test Card',
        company: 'Test Company',
        title: 'Test Title',
        email: 'test@example.com'
      }]);

    if (anonError) {
      console.log('Anon role insert failed as expected:', anonError.message);
    } else {
      console.error('WARNING: Anon role insert succeeded when it should have failed');
    }

    // Test 3: Sign in and insert with auth (should succeed for own user_id)
    console.log('\nTest 3: Sign in and insert with auth');
    const { data: authData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });

    if (signInError) {
      console.log('Auth test skipped - could not sign in:', signInError.message);
    } else {
      const { error: authInsertError } = await anonClient
        .from('business_cards')
        .insert([{
          user_id: authData.user.id,
          name: 'Auth Test Card',
          company: 'Auth Test Company',
          title: 'Auth Test Title',
          email: 'test@example.com'
        }]);

      if (authInsertError) {
        console.error('Authenticated insert failed:', authInsertError);
      } else {
        console.log('Authenticated insert succeeded');
      }
    }

  } catch (error) {
    console.error('Error running tests:', error);
  }
}

testRLSPolicies(); 
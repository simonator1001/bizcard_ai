import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('[Supabase] Initializing client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Add a connection test function
export const testConnection = async () => {
  try {
    console.log('[Supabase] Testing connection...');
    const { data, error } = await supabase
      .from('business_cards')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      console.error('[Supabase] Error code:', error.code);
      console.error('[Supabase] Error message:', error.message);
      console.error('[Supabase] Error status:', error.status);
      console.error('[Supabase] Error hint:', error.hint);
      console.error('[Supabase] Error details:', error.details);
      return false;
    }
    console.log('[Supabase] Connection test successful:', data);
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test error:', error);
    return false;
  }
}; 
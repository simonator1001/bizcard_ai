import { createClient } from '@supabase/supabase-js'

// Debug environment variables in detail
console.log('[Supabase] Environment debug:', {
  context: typeof window === 'undefined' ? 'server' : 'client',
  NODE_ENV: process.env.NODE_ENV,
  env_keys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8) + '...',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '(exists)' : '(missing)',
});

// Debug environment variables
const envCheck = {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  isServer: typeof window === 'undefined'
};

console.log('[Supabase] Environment check:', envCheck);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single instance of the Supabase client for client-side use
let _supabase = null;

// Initialize client with proper configuration
if (typeof window !== 'undefined') {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      debug: true
    },
    db: {
      schema: 'public'
    }
  });
  console.log('[Supabase] Client initialized with PKCE flow');
} else {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    }
  });
  console.log('[Supabase] Server client initialized');
}

// Add error handling for client initialization
if (!_supabase) {
  console.error('[Supabase] Failed to initialize client');
  throw new Error('Failed to initialize Supabase client');
}

// Test connection and log result
_supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth state changed:', event, session ? 'Session exists' : 'No session');
});

export const supabase = _supabase;

// Create service role client only on server-side and only if key is available
let _supabaseAdmin = null;

// Only initialize admin client on server-side
if (typeof window === 'undefined') {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Supabase] Service role key missing in server environment');
  } else {
    _supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
    console.log('[Supabase] Service role client initialized successfully');
  }
} else {
  console.log('[Supabase] Skipping admin client initialization on client-side');
}

// Export admin client for server-side use
export const supabaseAdmin = _supabaseAdmin;

// Add logging to help debug
export const testConnection = async () => {
  try {
    console.log('[Supabase] Testing connection...');
    console.log('[Supabase] URL:', supabaseUrl);
    console.log('[Supabase] Context:', typeof window === 'undefined' ? 'server' : 'client');
    console.log('[Supabase] Has service role:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Supabase] Session error:', sessionError);
      return false;
    }
    
    console.log('[Supabase] Current session:', session ? 'Found' : 'None');
    
    if (session) {
      // Test database access
      const { data, error } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('[Supabase] Connection test failed:', error);
        console.error('[Supabase] Error code:', error.code);
        console.error('[Supabase] Error message:', error.message);
        console.error('[Supabase] Error hint:', error.hint);
        console.error('[Supabase] Error details:', error.details);
        return false;
      }
      console.log('[Supabase] Connection test successful:', data);
    }
    
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test error:', error);
    return false;
  }
}; 
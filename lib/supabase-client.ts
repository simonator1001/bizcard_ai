import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { BusinessCard } from '@/types/business-card'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance of the Supabase client
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (_supabase) {
    console.debug('[Supabase] Returning existing client instance');
    return _supabase;
  }

  console.debug('[Supabase] Environment debug:', {
    context: typeof window === 'undefined' ? 'server' : 'client',
    NODE_ENV: process.env.NODE_ENV,
    env_keys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8) + '...',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '(exists)' : undefined
  });

  const isClient = typeof window !== 'undefined';
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.debug('[Supabase] Environment check:', {
    hasUrl,
    hasAnonKey,
    hasServiceKey,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    isServer: !isClient
  });

  if (!hasUrl || !hasAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  console.debug('[Supabase] Creating new client instance');

  if (isClient) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookies = document.cookie.split(';')
              .map(cookie => cookie.trim())
              .reduce((acc, cookie) => {
                const [name, value] = cookie.split('=')
                acc[name] = value
                return acc
              }, {} as Record<string, string>)
            console.debug('[Supabase] Getting cookie:', name, cookies[name])
            return cookies[name]
          },
          set(name: string, value: string, options: CookieOptions) {
            // Don't set domain for localhost
            const cookieOptions = [
              `${name}=${value}`,
              `path=${options.path || '/'}`,
            ]
            
            // Only add domain for production
            if (window.location.hostname !== 'localhost') {
              cookieOptions.push(`domain=.simon-gpt.com`)
            }
            
            // Add standard security options
            cookieOptions.push(
              `max-age=${options.maxAge || 31536000}`,
              'SameSite=Lax',
              'Secure'
            )
            
            const cookieStr = cookieOptions.join('; ')
            console.debug('[Supabase] Setting cookie:', {
              name,
              domain: window.location.hostname !== 'localhost' ? '.simon-gpt.com' : undefined,
              path: options.path,
              value: value.substring(0, 20) + '...'
            })
            document.cookie = cookieStr
          },
          remove(name: string, options: CookieOptions) {
            const cookieOptions = [
              `${name}=`,
              `path=${options.path || '/'}`,
              'expires=Thu, 01 Jan 1970 00:00:00 GMT',
              'SameSite=Lax',
              'Secure'
            ]
            
            // Only add domain for production
            if (window.location.hostname !== 'localhost') {
              cookieOptions.push(`domain=.simon-gpt.com`)
            }
            
            const cookieStr = cookieOptions.join('; ')
            console.debug('[Supabase] Removing cookie:', {
              name,
              domain: window.location.hostname !== 'localhost' ? '.simon-gpt.com' : undefined,
              path: options.path
            })
            document.cookie = cookieStr
          }
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          debug: true,
          storage: {
            getItem: (key: string) => {
              const value = window.localStorage.getItem(key)
              console.debug('[Supabase] Getting storage item:', key, value ? 'present' : 'missing')
              return value
            },
            setItem: (key: string, value: string) => {
              console.debug('[Supabase] Setting storage item:', key, value.substring(0, 20) + '...')
              window.localStorage.setItem(key, value)
            },
            removeItem: (key: string) => {
              console.debug('[Supabase] Removing storage item:', key)
              window.localStorage.removeItem(key)
            }
          }
        }
      }
    );
    console.debug('[Supabase] Client initialized with PKCE flow');
  } else {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.debug('[Supabase] Server client initialized');
  }

  return _supabase;
}

// Export initialized client
export const supabase = getSupabaseClient();

// Create service role client only on server-side and only if key is available
export function getSupabaseAdmin() {
  if (_supabaseAdmin) {
    console.debug('[Supabase] Returning existing admin client instance');
    return _supabaseAdmin;
  }

  const isClient = typeof window !== 'undefined';
  if (isClient) {
    console.debug('[Supabase] Skipping admin client initialization on client-side');
    return null;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase service role key');
  }

  console.debug('[Supabase] Creating new admin client instance');

  _supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  console.debug('[Supabase] Service role client initialized successfully');
  return _supabaseAdmin;
}

// Export admin client for server-side use
export const supabaseAdmin = getSupabaseAdmin();

// Test connection and log result
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  console.debug('[Supabase] Auth state changed:', event, session ? 'Session exists' : 'No session');
});

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

export async function getBusinessCards() {
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('No authenticated session');
    return [];
  }

  const { data: cards, error } = await supabase
    .from('business_cards')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching business cards:', error);
    throw error;
  }

  return cards;
}

export async function searchBusinessCards(query: string): Promise<BusinessCard[]> {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No authenticated session');
      return [];
    }

    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', session.user.id)
      .or(`name.ilike.%${query}%,company.ilike.%${query}%,title.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching business cards:', error);
      throw error;
    }

    return (data || []) as BusinessCard[];
  } catch (error) {
    console.error('Error searching business cards:', error);
    throw error;
  }
}

// Add debug function
export const debugAuth = async () => {
  try {
    console.debug('[Supabase] Debug auth state:');
    
    // Check storage
    if (typeof window !== 'undefined') {
      console.debug('[Supabase] Local storage:', {
        keys: Object.keys(window.localStorage),
        hasToken: !!window.localStorage.getItem('sb-auth-token'),
        hasRefreshToken: !!window.localStorage.getItem('sb-auth-token-refresh'),
        cookies: document.cookie.split(';')
          .map(c => c.trim())
          .filter(c => c.startsWith('sb-'))
          .map(c => ({ name: c.split('=')[0], value: c.split('=')[1].substring(0, 20) + '...' }))
      });
    }
    
    // Check session
    const { data: { session }, error } = await supabase.auth.getSession();
    console.debug('[Supabase] Current session:', session ? {
      id: session.user.id,
      email: session.user.email,
      expires: new Date(session.expires_at! * 1000).toISOString()
    } : 'None');
    
    if (error) {
      console.error('[Supabase] Session error:', error);
    }
    
    return { session, error };
  } catch (error) {
    console.error('[Supabase] Debug error:', error);
    return { error };
  }
};
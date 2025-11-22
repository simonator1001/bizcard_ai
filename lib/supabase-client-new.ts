import { createClient as createSupabaseClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { BusinessCard } from '@/types/business-card'

// Use the URL from environment variable - required for Coolify Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required. Please configure it in .env.local');
}

// Debug environment variables in detail
console.log('[Supabase New Client] Environment debug:', {
  context: typeof window === 'undefined' ? 'server' : 'client',
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  URL_MATCH: process.env.NEXT_PUBLIC_SUPABASE_URL === SUPABASE_URL
});

// Create a single instance of the Supabase client
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Helper to clear all Supabase cookies
const clearAllSupabaseCookies = () => {
  if (typeof window === 'undefined') return;
  
  const allCookies = document.cookie.split(';');
  console.warn('[Supabase New] Clearing ALL Supabase cookies');
  
  // Look for any Supabase-related cookies
  for (const cookie of allCookies) {
    const [name] = cookie.trim().split('=');
    
    // If it's a Supabase cookie
    if (name && (name.startsWith('sb-') || name.includes('supabase'))) {
      console.warn(`[Supabase New] Clearing cookie: ${name}`);
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax`;
    }
  }
  
  // Clear localStorage items
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      console.warn(`[Supabase New] Clearing localStorage item: ${key}`);
      localStorage.removeItem(key);
    }
  }
};

export function createClient() {
  const isClient = typeof window !== 'undefined';
  
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required. Please configure it in .env.local');
  }
  
  if (!isClient) {
    console.debug('[Supabase New] Creating server-side client');
    return createSupabaseClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  console.debug('[Supabase New] Creating browser client with cookie handling');
  
  // Removing automatic cookie clearing to prevent auth issues
  // clearAllSupabaseCookies();
  
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required. Please configure it in .env.local');
  }
  
  return createBrowserClient(
    SUPABASE_URL,
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
          console.debug('[Supabase New] Getting cookie:', {
            name,
            exists: !!cookies[name],
            allCookies: Object.keys(cookies).filter(k => k.startsWith('sb-')),
            hostname: window.location.hostname,
            path: window.location.pathname
          })
          return cookies[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')
          const cookieOptions = [
            `${name}=${value}`,
            `path=${options.path || '/'}`,
            `max-age=${options.maxAge || 3600}`,
            'SameSite=Lax'
          ]
          
          if (!isLocalhost || window.location.protocol === 'https:') {
            cookieOptions.push('Secure')
          }
          
          const cookieStr = cookieOptions.join('; ')
          console.debug('[Supabase New] Setting cookie:', {
            name,
            valuePreview: value.substring(0, 20) + '...',
            isLocalhost,
            protocol: window.location.protocol,
            options: cookieOptions,
            hostname: window.location.hostname,
            path: window.location.pathname
          })
          document.cookie = cookieStr
        },
        remove(name: string, options: CookieOptions) {
          console.debug('[Supabase New] Removing cookie:', {
            name,
            hostname: window.location.hostname,
            path: window.location.pathname
          })
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')
          const cookieOptions = [
            `${name}=`,
            `path=${options.path || '/'}`,
            'expires=Thu, 01 Jan 1970 00:00:00 GMT',
            'SameSite=Lax'
          ]
          
          if (!isLocalhost || window.location.protocol === 'https:') {
            cookieOptions.push('Secure')
          }
          
          document.cookie = cookieOptions.join('; ')
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
            console.debug('[Supabase New] Getting storage item:', {
              key,
              exists: !!value,
              allKeys: Object.keys(window.localStorage).filter(k => k.startsWith('sb-')),
              hostname: window.location.hostname,
              path: window.location.pathname
            })
            return value
          },
          setItem: (key: string, value: string) => {
            console.debug('[Supabase New] Setting storage item:', {
              key,
              valuePreview: value.substring(0, 20) + '...',
              hostname: window.location.hostname,
              path: window.location.pathname
            })
            window.localStorage.setItem(key, value)
          },
          removeItem: (key: string) => {
            console.debug('[Supabase New] Removing storage item:', {
              key,
              hostname: window.location.hostname,
              path: window.location.pathname
            })
            window.localStorage.removeItem(key)
          }
        }
      }
    }
  )
}

export function getSupabaseClient() {
  if (_supabase) {
    console.debug('[Supabase New] Returning existing client instance');
    return _supabase;
  }

  console.debug('[Supabase New] Creating new client instance');
  _supabase = createClient();
  return _supabase;
}

// Export initialized client
export const supabase = getSupabaseClient();

// Create service role client only on server-side and only if key is available
export function getSupabaseAdmin() {
  if (_supabaseAdmin) {
    console.debug('[Supabase New] Returning existing admin client instance');
    return _supabaseAdmin;
  }

  const isClient = typeof window !== 'undefined';
  if (isClient) {
    console.debug('[Supabase New] Skipping admin client initialization on client-side');
    return null;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase service role key');
  }

  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }

  console.debug('[Supabase New] Creating new admin client instance');

  _supabaseAdmin = createSupabaseClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  console.debug('[Supabase New] Service role client initialized successfully');
  return _supabaseAdmin;
}

// Export admin client for server-side use
export const supabaseAdmin = getSupabaseAdmin();

/**
 * Update a user's app_metadata to include role: 'authenticated' using the admin API.
 * @param userId The user's UUID
 * @param role The role to set (default: 'authenticated')
 */
export async function updateUserRole(userId: string, role: string = 'authenticated') {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role }
  });
  if (error) {
    console.error('[Supabase New] Error updating user role:', error);
    throw error;
  }
  return data;
}

// Test connection and log result
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  console.debug('[Supabase New] Auth state changed:', {
    event,
    sessionExists: !!session,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    path: typeof window !== 'undefined' ? window.location.pathname : 'server'
  });
});

// Add logging to help debug
export const testConnection = async () => {
  try {
    console.log('[Supabase New] Testing connection...');
    console.log('[Supabase New] URL:', SUPABASE_URL);
    console.log('[Supabase New] Context:', typeof window === 'undefined' ? 'server' : 'client');
    console.log('[Supabase New] Has service role:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Supabase New] Session error:', sessionError);
      return false;
    }
    
    console.log('[Supabase New] Current session:', session ? 'Found' : 'None');
    
    if (session) {
      // Test database access
      const { data, error } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('[Supabase New] Connection test failed:', error);
        console.error('[Supabase New] Error code:', error.code);
        console.error('[Supabase New] Error message:', error.message);
        console.error('[Supabase New] Error hint:', error.hint);
        console.error('[Supabase New] Error details:', error.details);
        return false;
      }
      console.log('[Supabase New] Connection test successful:', data);
    }
    
    return true;
  } catch (error) {
    console.error('[Supabase New] Connection test error:', error);
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

// Function to force signout and clear cookies
export const forceSignOut = async () => {
  try {
    await supabase.auth.signOut();
    clearAllSupabaseCookies();
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
    return true;
  } catch (error) {
    console.error('[Supabase New] Force sign out error:', error);
    return false;
  }
}; 
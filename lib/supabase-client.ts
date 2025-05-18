import { createClient as createSupabaseClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { BusinessCard } from '@/types/business-card'

console.log('[DEBUG] [supabase-client.ts] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Use the URL from environment variable instead of hardcoding it
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rzmqepriffysavamtxzg.supabase.co';

// Debug environment variables in detail
console.log('[Supabase] Environment debug:', {
  context: typeof window === 'undefined' ? 'server' : 'client',
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  URL_MATCH: process.env.NEXT_PUBLIC_SUPABASE_URL === SUPABASE_URL
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

// Helper to get a sanitized domain for cookies
const getCookieDomain = () => {
  if (typeof window === 'undefined') return undefined;
  
  const hostname = window.location.hostname;
  
  // For localhost, never set a domain - this avoids issues with cookie settings
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return undefined;
  }
  
  // Production domains - use the highest level domain to share cookies across subdomains
  if (hostname.includes('simon-gpt.com')) {
    return 'simon-gpt.com';
  }
  
  // For all other cases, return the hostname to ensure cookies work properly
  return hostname;
};

export function createClient() {
  const isClient = typeof window !== 'undefined';
  
  if (!isClient) {
    console.debug('[Supabase] Creating server-side client');
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

  console.debug('[Supabase] Creating browser client with cookie handling');
  
  // Extract project ID from supabase URL for cookie naming
  const projectId = supabaseUrl.split('//')[1]?.split('.')[0] || 'rzmqepriffysavamtxzg';
  const cookiePrefix = `sb-${projectId}`;
  
  return createBrowserClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookieString = document.cookie;
          const cookies = cookieString.split(';')
            .map(cookie => cookie.trim())
            .reduce((acc, cookie) => {
              const [cookieName, ...rest] = cookie.split('=');
              if (cookieName) {
                // Handle cookies with = in the value
                acc[cookieName] = rest.join('=');
              }
              return acc;
            }, {} as Record<string, string>);
          
          console.debug('[Supabase] Getting cookie:', {
            name,
            exists: !!cookies[name],
            valuePreview: cookies[name] ? cookies[name].substring(0, 10) + '...' : null,
            valueLength: cookies[name] ? cookies[name].length : 0,
            allCookies: Object.keys(cookies)
          });
          
          // First try the cookie
          if (cookies[name]) {
            return cookies[name];
          }
          
          // If not in cookies, check all localStorage backups
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              // Try primary backup in localStorage
              for (let i = 0; i <= 4; i++) {
                const backupKey = `${name}.${i}`;
                const value = window.localStorage.getItem(backupKey);
                if (value) {
                  console.debug('[Supabase] Retrieved code verifier from localStorage primary backup:', {
                    name: backupKey,
                    valuePreview: value ? value.substring(0, 10) + '...' : null,
                    valueLength: value ? value.length : 0
                  });
                  return value;
                }
              }
              
              // Also check if original key exists in localStorage
              const value = window.localStorage.getItem(name);
              if (value) {
                console.debug('[Supabase] Retrieved code verifier from localStorage original key:', {
                  name,
                  valuePreview: value ? value.substring(0, 10) + '...' : null,
                  valueLength: value ? value.length : 0
                });
                return value;
              }
            } catch (e) {
              console.error('[Supabase] Error accessing localStorage:', e);
            }
          }
          
          return null;
        },
        set(name: string, value: string, options: any = {}) {
          console.debug('[Supabase] Setting cookie:', {
            name,
            valuePreview: value ? value.substring(0, 10) + '...' : null,
            valueLength: value ? value.length : 0,
            options
          });
          
          // Set the actual cookie
          document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${
            options.maxAge || 86400
          }; SameSite=${options.sameSite || 'Lax'}${
            options.domain ? `; domain=${options.domain}` : ''
          }${options.secure ? '; Secure' : ''}`;
          
          // Also save in localStorage as backup
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              // Save in multiple backup slots for redundancy
              for (let i = 0; i <= 4; i++) {
                const backupKey = `${name}.${i}`;
                window.localStorage.setItem(backupKey, value);
              }
              
              // Also set the original key
              window.localStorage.setItem(name, value);
              
              console.debug('[Supabase] Saved cookies to localStorage backup');
            } catch (e) {
              console.error('[Supabase] Error saving to localStorage:', e);
            }
          }
        },
        remove(name: string, options: any = {}) {
          console.debug('[Supabase] Removing cookie:', { name, options });
          
          // Remove the actual cookie
          document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${
            options.sameSite || 'Lax'
          }${options.domain ? `; domain=${options.domain}` : ''}${
            options.secure ? '; Secure' : ''
          }`;
          
          // Also clean up localStorage
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              // Clean up all backup slots
              for (let i = 0; i <= 4; i++) {
                const backupKey = `${name}.${i}`;
                window.localStorage.removeItem(backupKey);
              }
              
              // Also remove the original key
              window.localStorage.removeItem(name);
              
              console.debug('[Supabase] Removed cookies from localStorage backup');
            } catch (e) {
              console.error('[Supabase] Error removing from localStorage:', e);
            }
          }
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
            try {
              // Try to get from localStorage first
              const value = window.localStorage.getItem(key);
              
              // For code verifier, we also need to check cookies as fallback
              if (!value && key.includes('code-verifier')) {
                // Check cookie as fallback for code verifier
                const cookieName = key;
                const cookieValue = document.cookie
                  .split('; ')
                  .find(row => row.startsWith(`${cookieName}=`))
                  ?.split('=')[1];
                
                if (cookieValue) {
                  console.debug('[Supabase] Retrieved code verifier from cookie fallback:', {
                    key,
                    valueLength: cookieValue.length,
                    valuePreview: cookieValue.substring(0, 10) + '...'
                  });
                  return cookieValue;
                }
                
                // Last resort - check other localStorage keys that might contain the verifier
                for (let i = 0; i < localStorage.length; i++) {
                  const storedKey = localStorage.key(i);
                  if (storedKey && storedKey.includes('code-verifier')) {
                    const storedValue = localStorage.getItem(storedKey);
                    if (storedValue) {
                      console.debug('[Supabase] Found code verifier in another localStorage key:', { 
                        originalKey: key,
                        foundKey: storedKey,
                        valueLength: storedValue.length,
                        valuePreview: storedValue.substring(0, 10) + '...'
                      });
                      return storedValue;
                    }
                  }
                }
              }
              
              console.debug('[Supabase] Getting storage item:', {
                key,
                exists: !!value,
                valueLength: value ? value.length : 0,
                valuePreview: value ? value.substring(0, 10) + '...' : null,
                allKeys: Object.keys(window.localStorage).filter(k => k.includes(cookiePrefix) || k.includes('supabase')),
                hostname: window.location.hostname,
                path: window.location.pathname
              });
              return value;
            } catch (error) {
              console.error('[Supabase] Error accessing localStorage:', error);
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            try {
              console.debug('[Supabase] Setting storage item:', {
                key,
                valueLength: value.length,
                valuePreview: value.substring(0, 10) + '...',
                hostname: window.location.hostname,
                path: window.location.pathname
              });
              window.localStorage.setItem(key, value);
            } catch (error) {
              console.error('[Supabase] Error setting localStorage item:', error);
            }
          },
          removeItem: (key: string) => {
            try {
              console.debug('[Supabase] Removing storage item:', {
                key,
                hostname: window.location.hostname,
                path: window.location.pathname
              });
              window.localStorage.removeItem(key);
            } catch (error) {
              console.error('[Supabase] Error removing localStorage item:', error);
            }
          }
        }
      }
    }
  );
}

export function getSupabaseClient() {
  if (_supabase) {
    console.debug('[Supabase] Returning existing client instance');
    return _supabase;
  }

  console.debug('[Supabase] Creating new client instance');
  _supabase = createClient();
  return _supabase;
}

// Export initialized client
export const supabase = getSupabaseClient();

// Call the getSupabase function during initialization to check for URL mismatches in cookies
getSupabase();

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

  console.debug('[Supabase] Service role client initialized successfully');
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
    console.error('[Supabase] Error updating user role:', error);
    throw error;
  }
  return data;
}

// Test connection and log result
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  console.debug('[Supabase] Auth state changed:', {
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
    console.log('[Supabase] Testing connection...');
    console.log('[Supabase] URL:', SUPABASE_URL);
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

// Function to force signout and clear cookies
export const forceSignOut = async () => {
  try {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
    return true;
  } catch (error) {
    console.error('[Supabase] Force sign out error:', error);
    return false;
  }
};

// Call getSupabase function to check for URL mismatches in cookies
export function getSupabase() {
  // Just return the supabase client without clearing cookies
  return supabase;
}
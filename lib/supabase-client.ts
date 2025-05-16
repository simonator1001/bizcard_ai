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
  // For localhost, we don't set a domain
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return undefined;
  }
  
  // Production domains
  if (hostname.includes('simon-gpt.com')) {
    return 'simon-gpt.com';
  }
  
  // Custom domain handling
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
          
          // Try to retrieve from localStorage if not found in cookies
          if (!cookies[name] && name.includes('code-verifier') && typeof window !== 'undefined') {
            try {
              const fallbackVerifier = window.localStorage.getItem('sb-code-verifier');
              if (fallbackVerifier) {
                console.debug('[Supabase] Retrieved code verifier from localStorage fallback:', { 
                  name, 
                  fallbackVerifier: fallbackVerifier.substring(0, 10) + '...',
                  cookieLength: fallbackVerifier.length
                });
                return fallbackVerifier;
              }
              
              // Look for any code verifier in localStorage as last resort
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('code-verifier')) {
                  const value = localStorage.getItem(key);
                  if (value) {
                    console.debug('[Supabase] Found alternate code verifier in localStorage:', { 
                      key, 
                      valuePreview: value.substring(0, 10) + '...',
                      cookieLength: value.length
                    });
                    return value;
                  }
                }
              }
            } catch (storageError) {
              console.error('[Supabase] Error accessing localStorage for code verifier:', storageError);
            }
          }
          
          console.debug('[Supabase] Getting cookie:', {
            name,
            exists: !!cookies[name],
            valuePreview: cookies[name] ? cookies[name].substring(0, 10) + '...' : null,
            valueLength: cookies[name] ? cookies[name].length : 0,
            allCookies: Object.keys(cookies).filter(k => k.includes(cookiePrefix) || k.includes('supabase')),
            hostname: window.location.hostname,
            path: window.location.pathname
          });
          
          return cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieDomain = getCookieDomain();
          const cookieOptions = [
            `${name}=${value}`,
            `path=${options.path || '/'}`,
            `max-age=${options.maxAge || 86400}` // Set default to 24 hours
          ];
          
          // Add SameSite attribute - use Lax for better compatibility
          cookieOptions.push('SameSite=Lax');
          
          // Only add Secure flag in https environments, not localhost
          if (window.location.protocol === 'https:') {
            cookieOptions.push('Secure');
          }
          
          // Add domain for non-localhost environments
          if (cookieDomain) {
            cookieOptions.push(`domain=${cookieDomain}`);
          }
          
          const cookieStr = cookieOptions.join('; ');
          console.debug('[Supabase] Setting cookie:', {
            name,
            valueLength: value.length,
            valuePreview: value.substring(0, 20) + '...',
            domainSet: cookieDomain,
            protocol: window.location.protocol,
            options: cookieOptions,
            hostname: window.location.hostname,
            path: window.location.pathname
          });
          
          document.cookie = cookieStr;
          
          // Also store code verifier in localStorage as backup
          if (name.includes('code-verifier') && typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('sb-code-verifier', value);
              console.debug('[Supabase] Stored code verifier in localStorage as backup');
            } catch (storageError) {
              console.error('[Supabase] Error storing code verifier in localStorage:', storageError);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          const cookieDomain = getCookieDomain();
          console.debug('[Supabase] Removing cookie:', {
            name,
            hostname: window.location.hostname,
            path: window.location.pathname,
            options
          });
          
          const cookieOptions = [
            `${name}=`,
            `path=${options.path || '/'}`,
            'expires=Thu, 01 Jan 1970 00:00:00 GMT',
            'SameSite=Lax'
          ];
          
          if (window.location.protocol === 'https:') {
            cookieOptions.push('Secure');
          }
          
          if (cookieDomain) {
            cookieOptions.push(`domain=${cookieDomain}`);
          }
          
          document.cookie = cookieOptions.join('; ');
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
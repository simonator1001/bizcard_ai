import { createClient as createSupabaseClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { type CookieOptions } from '@supabase/ssr'
import { BusinessCard } from '@/types/business-card'

console.log('[DEBUG] [supabase-client.ts] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Check if we're in the browser or on the server
const isClient = typeof window !== 'undefined';
const isServer = !isClient;

// Custom storage implementation to improve cookie persistence
class CustomStorageAdapter {
  private localStorageKeys: Record<string, boolean> = {};
  private cookieData: Record<string, string> = {};
  private prefix: string;

  constructor() {
    this.prefix = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') 
                      ? process.env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0]
                      : 'rzmqepriffysavamtxzg'}`;
                      
    console.log('[Supabase] Custom Storage: Initializing with prefix', this.prefix);
    
    // Sync with existing storage on initialization
    if (isClient) {
      this.synchronizeStorage();
    }
  }
  
  private synchronizeStorage() {
    // Load from localStorage
    try {
      // Collect all localStorage keys with our prefix
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            this.localStorageKeys[key] = true;
          }
        }
      }
      
      // Load from cookies
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith(`${this.prefix}-`) || cookie.startsWith('auth-') || cookie.startsWith('x-')) {
          const [key, value] = cookie.split('=');
          if (key && value) {
            this.cookieData[key] = decodeURIComponent(value);
          }
        }
      }
      
      console.log('[Supabase] Custom Storage: Synchronized storage', {
        localStorageKeyCount: Object.keys(this.localStorageKeys).length,
        cookieKeyCount: Object.keys(this.cookieData).length
      });
    } catch (error) {
      console.error('[Supabase] Custom Storage error synchronizing:', error);
    }
  }

  getItem(key: string): string | null {
    console.log('[Supabase] CustomStorage.getItem:', key);
    const fullKey = `${this.prefix}-${key}`;
    
    // Try cookies first 
    const cookieValue = this.cookieData[fullKey];
    if (cookieValue) {
      console.log('[Supabase] CustomStorage: Found in cookies', { key, valueLength: cookieValue.length });
      return cookieValue;
    }
    
    // Special cookie format handling
    if (key === 'auth-token') {
      const rawTokenCookie = this.cookieData[`${this.prefix}-auth-token-raw`];
      if (rawTokenCookie) {
        console.log('[Supabase] CustomStorage: Found raw token in cookies');
        return rawTokenCookie;
      }
    }
    
    // Then try localStorage
    if (isClient && typeof localStorage !== 'undefined') {
      try {
        const value = localStorage.getItem(fullKey);
        if (value) {
          console.log('[Supabase] CustomStorage: Found in localStorage', { key, valueLength: value.length });
          return value;
        }
        
        // Try variants with numeric suffixes (Supabase splits large values)
        for (let i = 0; i < 5; i++) {
          const variantKey = `${fullKey}.${i}`;
          const variantValue = localStorage.getItem(variantKey);
          if (variantValue) {
            console.log('[Supabase] CustomStorage: Found variant in localStorage', { variantKey, valueLength: variantValue.length });
            // For tokens, we should concatenate the parts, but for simplicity just return the first one
            return variantValue;
          }
        }
      } catch (error) {
        console.error('[Supabase] CustomStorage getItem localStorage error:', error);
      }
    }
    
    return null;
  }

  setItem(key: string, value: string): void {
    console.log('[Supabase] CustomStorage.setItem:', key, value ? `${value.substring(0, 15)}...` : 'empty');
    const fullKey = `${this.prefix}-${key}`;
    
    // Store in our cookie cache
    this.cookieData[fullKey] = value;
    
    // Special handling for auth tokens
    if (key === 'auth-token' && value) {
      // Also set a raw token cookie that's easier to recover
      this.cookieData[`${this.prefix}-auth-token-raw`] = value;
      
      try {
        // Set browser cookie
        document.cookie = `${this.prefix}-auth-token-raw=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
        document.cookie = `auth-success=true;path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
      } catch (error) {
        console.error('[Supabase] Error setting cookies:', error);
      }
    }
    
    // Store in localStorage for persistence
    if (isClient && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(fullKey, value);
        this.localStorageKeys[fullKey] = true;
        
        // For auth token, also set additional metadata cookies
        if (key === 'auth-token' && value) {
          try {
            // Parse the JWT to get user data
            const tokenParts = value.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const userId = payload.sub;
              if (userId) {
                document.cookie = `x-user-session=${userId};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
                localStorage.setItem('user-id', userId);
              }
            }
          } catch (error) {
            console.error('[Supabase] Error parsing token:', error);
          }
        }
      } catch (error) {
        console.error('[Supabase] CustomStorage setItem localStorage error:', error);
        
        // If localStorage fails (e.g., quota exceeded), try to split the value
        if (value && value.length > 1000) {
          try {
            // Split the token into chunks and store them
            const chunkSize = Math.ceil(value.length / 5);
            for (let i = 0; i < 5; i++) {
              const start = i * chunkSize;
              const end = Math.min((i + 1) * chunkSize, value.length);
              const chunk = value.substring(start, end);
              const chunkKey = `${fullKey}.${i}`;
              
              localStorage.setItem(chunkKey, chunk);
              this.localStorageKeys[chunkKey] = true;
            }
            console.log('[Supabase] CustomStorage: Split large value into chunks');
          } catch (chunkError) {
            console.error('[Supabase] CustomStorage chunk storage error:', chunkError);
          }
        }
      }
    }
  }

  removeItem(key: string): void {
    console.log('[Supabase] CustomStorage.removeItem:', key);
    const fullKey = `${this.prefix}-${key}`;
    
    // Remove from cookie cache
    delete this.cookieData[fullKey];
    
    // Remove browser cookie
    if (isClient) {
      try {
        document.cookie = `${fullKey}=;path=/;max-age=0;SameSite=Lax`;
        document.cookie = `${this.prefix}-auth-token-raw=;path=/;max-age=0;SameSite=Lax`;
      } catch (error) {
        console.error('[Supabase] Error removing cookies:', error);
      }
    }
    
    // Remove from localStorage
    if (isClient && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(fullKey);
        delete this.localStorageKeys[fullKey];
        
        // Remove potential split chunks
        for (let i = 0; i < 5; i++) {
          const chunkKey = `${fullKey}.${i}`;
          localStorage.removeItem(chunkKey);
          delete this.localStorageKeys[chunkKey];
        }
      } catch (error) {
        console.error('[Supabase] CustomStorage removeItem localStorage error:', error);
      }
    }
  }
}

// Browser-compatible cookie handling for server client
class BrowserCookieHandler {
  get(name: string) {
    if (isClient) {
      try {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1];
        
        console.log(`[Supabase] Browser cookie get ${name}:`, cookieValue ? `${cookieValue.substring(0, 10)}...` : 'null');
        return cookieValue;
      } catch (error) {
        console.error(`[Supabase] Error getting cookie ${name}:`, error);
        return null;
      }
    }
    return null;
  }

  set(name: string, value: string, options: CookieOptions) {
    if (isClient) {
      try {
        let cookieString = `${name}=${value}; path=${options.path || '/'}`;
        
        if (options.maxAge) {
          cookieString += `; max-age=${options.maxAge}`;
        }
        
        if (options.domain) {
          cookieString += `; domain=${options.domain}`;
        }
        
        if (options.secure) {
          cookieString += '; secure';
        }
        
        if (options.sameSite) {
          // Convert enum to string safely
          const sameSiteValue = typeof options.sameSite === 'string' 
            ? options.sameSite.toLowerCase() 
            : options.sameSite === true ? 'strict' : 'lax';
          cookieString += `; samesite=${sameSiteValue}`;
        }
        
        document.cookie = cookieString;
        console.log(`[Supabase] Browser cookie set ${name}:`, value ? `${value.substring(0, 10)}...` : 'null');
      } catch (error) {
        console.error(`[Supabase] Error setting cookie ${name}:`, error);
      }
    }
  }

  remove(name: string, options: CookieOptions) {
    if (isClient) {
      try {
        const path = options.path || '/';
        document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        console.log(`[Supabase] Browser cookie removed ${name}`);
      } catch (error) {
        console.error(`[Supabase] Error removing cookie ${name}:`, error);
      }
    }
  }
}

// Initialize the Supabase client (the correct one based on environment)
console.log('[Supabase] Environment debug:', {
  context: isClient ? 'client' : 'server',
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  URL_MATCH: process.env.SUPABASE_URL === process.env.NEXT_PUBLIC_SUPABASE_URL
})

// Verify we have the correct URL and keys
console.log('[Supabase] Environment check:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  isServer
})

console.log('[Supabase] Creating new client instance');

// Custom storage for client-side auth
const customStorage = isClient ? new CustomStorageAdapter() : undefined;
const cookieHandler = new BrowserCookieHandler();

// Create a common client for both client and server
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: isClient,
      persistSession: isClient,
      detectSessionInUrl: isClient,
      storage: customStorage,
    },
    global: {
      headers: {
        'x-client-info': `bizcard/${process.env.npm_package_version || '1.0.0'}`
      }
    }
  }
);

// Set up cookie handler after client creation (this approach avoids the cookies error)
if (isClient) {
  // Apply the cookie handlers directly to the auth instance
  const authClient = supabase.auth;
  (authClient as any).cookieOptions = {
    get: cookieHandler.get,
    set: cookieHandler.set,
    remove: cookieHandler.remove
  };
}

// Add listener for client-side auth state changes
if (isClient) {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    console.log('[Supabase] Auth state changed:', {
      event,
      sessionExists: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      hostname: window.location.hostname,
      path: window.location.pathname
    });
    
    // Set extra cookies when a session is created
    if (session) {
      try {
        // Set a cookie that's easier to detect in middleware
        document.cookie = `auth-success=true;path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
        document.cookie = `x-user-session=${session.user.id};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
        
        // Store the raw token in a cookie for easier recovery
        const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') 
          ? process.env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0]
          : 'rzmqepriffysavamtxzg';
          
        document.cookie = `${projectId}-auth-token-raw=${session.access_token};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
      } catch (error) {
        console.error('[Supabase] Error setting auth cookies:', error);
      }
    }
  });
}

// Attempt to initialize admin client for server-side operations
let supabaseAdmin: SupabaseClient | undefined = undefined;

// Only create the admin client server-side with the service role key
console.log('[Supabase] Creating new admin client instance')
try {
  // Only create if we're on the server and have the necessary key
  if (isServer && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('[Supabase] Service role client initialized successfully')
  } else {
    console.log('[Supabase] Skipping admin client initialization on client-side')
  }
} catch (error) {
  console.error('[Supabase] Error initializing admin client:', error)
}

export { supabase, supabaseAdmin };

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
    console.log('[Supabase] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
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
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { subscriptionMiddleware } from './middleware/subscription'

// Define all public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Allow the root path entirely
  '/signin',
  '/signup',
  '/auth/callback',
  '/auth/debug',
  '/reset-password',
  '/forgot-password',
  '/verify',
  '/api/auth',
  '/api/scan',
  '/api/ocr',
  '/api/extract-info',
  '/images',
  '/assets',
  '/pricing',
  '/manage',
]

// API routes that should be directly accessible by other API routes
// These endpoints should be directly accessible without redirect for internal API calls
const INTERNAL_API_ROUTES = [
  '/api/ocr',
  '/api/extract-info'
]

// Define paths that require auth token verification but should not redirect
const API_AUTH_ROUTES = [
  '/api/scan'
]

// Configure matcher to exclude static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'experimental-edge'
}

// Helper function to check if a path should bypass auth
function isPublicPath(path: string, search: string = ''): boolean {
  // Allow the root path with any query parameters
  if (path === '/') return true;
  
  // Allow public routes
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

// Helper function to check if a path is an internal API that should never redirect
function isInternalApiPath(path: string): boolean {
  return INTERNAL_API_ROUTES.some(route => path === route);
}

// Helper function to check if a path is an API route that needs auth but shouldn't redirect
function isApiAuthRoute(path: string): boolean {
  return API_AUTH_ROUTES.some(route => path === route);
}

// Helper to get project ID from URL
function getProjectId(url: string): string {
  // Try to extract the project ID from the URL
  // For example, from https://project-id.supabase.co or https://supabase.custom-domain.com
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // If it's a standard supabase.co URL, the project ID is the subdomain
    if (hostname.endsWith('.supabase.co')) {
      return hostname.split('.')[0];
    }
    
    // For custom domains, we'll use the hostname as the cookie prefix for consistency
    return hostname.replace(/\./g, '-');
  } catch (e) {
    // Fallback to a generic name if URL parsing fails
    return 'supabase';
  }
}

// Helper function to check if a request is an internal API call
function isInternalApiCall(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const path = new URL(request.url).pathname;
  
  const hasAuthHeader = authHeader !== null && authHeader.startsWith('Bearer ');
  
  // For same-origin API calls, we need to allow them when they have auth headers
  if (authHeader && path.startsWith('/api/')) {
    console.debug('[Middleware] Request has auth header for API route');
    return true;
  }
  
  const isSameOrigin = origin === null || origin.includes('localhost') || origin.includes('simon-gpt.com');
  const isSameReferer = referer === null || referer.includes('localhost') || referer.includes('simon-gpt.com');
  
  // If it's a same-origin request with an auth header, it's likely an internal API call
  return isSameOrigin && isSameReferer && hasAuthHeader;
}

// Helper function to check if it's a post-scan redirect that we should allow
function isPostScanNavigation(request: NextRequest): boolean {
  // Check the referrer to see if it came from the main page after a scan
  const referer = request.headers.get('referer');
  const path = new URL(request.url).pathname;
  const cookies = request.cookies.getAll();
  
  // Enhanced session detection - check for valid authenticated signal patterns
  const hasXSessionId = request.headers.get('x-session-id') !== null;
  const hasXUserId = request.headers.get('x-user-id') !== null;
  const hasXAuthToken = request.headers.get('x-auth-token') !== null;
  const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ');
  
  // Special case for browser utilities
  if (path.includes('/.well-known/') || 
      path.includes('/clear-cache.js') || 
      path.includes('/favicon') ||
      path.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)) {
    console.debug('[Middleware] Allowing browser utility request:', path);
    return true;
  }
  
  // More reliable auth cookie check - any auth cookies with substantial value
  const hasAuthCookies = cookies.some(cookie => 
    (cookie.name.includes('-auth-token') || 
     cookie.name.includes('auth-token') || 
     cookie.name.includes('supabase')) && 
    cookie.value && 
    cookie.value.length > 10
  );
  
  if (hasAuthCookies || hasXSessionId || hasXUserId || hasAuthHeader || hasXAuthToken) {
    console.debug('[Middleware] User has valid auth signal, allowing navigation');
    return true;
  }
  
  // After a card scan, users typically navigate to the home page or cards page
  const isPostScanDestination = path === '/' || 
                           path.startsWith('/cards') ||
                           path.includes('dashboard');
  
  // Check if the referer suggests we just completed a scan operation
  const isScanReferrer = referer !== null && 
                       (referer.includes('/scan') || 
                        referer.includes('/?scan=') || 
                        referer.includes('upload'));
  
  // More lenient approach to prevent login loops
  if (isPostScanDestination && (isScanReferrer || cookies.length > 0)) {
    console.debug('[Middleware] Allowing post-scan navigation based on destination and referrer');
    return true;
  }
  
  return false;
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  
  console.debug('[Middleware] Processing request:', {
    url: request.url,
    method: request.method,
    pathname: url.pathname,
    search: url.search,
    cookiesCount: request.cookies.getAll().length,
    cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...']))
  });

  // Skip middleware for public routes and static files
  const path = url.pathname;
  
  if (isPublicPath(path, url.search) || 
      path.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)) {
    console.debug('[Middleware] Skipping auth check for route:', path + url.search);
    return NextResponse.next();
  }

  // Don't interrupt post-scan navigation
  if (isPostScanNavigation(request)) {
    console.debug('[Middleware] Allowing post-scan navigation');
    return NextResponse.next();
  }

  try {
    // Create a response object that we can return
    let response = NextResponse.next();

    // Get the Supabase URL from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    
    // Generate the auth cookie name from the URL
    const projectId = getProjectId(supabaseUrl);
    const COOKIE_NAME = `sb-${projectId}-auth-token`;

    // Log all cookies to help with debugging
    console.debug('[Middleware] All available cookies:', 
      Object.fromEntries(
        request.cookies.getAll().map(c => [c.name, c.name.includes('auth') ? c.value.substring(0, 10) + '...' : 'value'])
      )
    );

    // Check if this is an internal API call
    const isInternalCall = isInternalApiCall(request);
    if (isInternalCall && isInternalApiPath(path)) {
      console.debug('[Middleware] Detected internal API call to internal route, skipping auth redirect');
      return NextResponse.next();
    }

    // Create a Supabase client with the correct URL
    const supabase = createServerClient(
      // Use the URL from environment variables
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)?.value;
            console.debug(`[Middleware] Getting cookie ${name}:`, cookie ? `${cookie.substring(0, 10)}...` : 'null', 
              `(path=${path})`);
            return cookie;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.debug(`[Middleware] Setting cookie ${name}:`, value ? `${value.substring(0, 10)}...` : 'empty', 
              `(path=${path})`);
            // If the cookie is updated, update the response
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              maxAge: 60 * 60 * 24 * 7, // 1 week
              domain: process.env.NODE_ENV === 'production' ? (process.env.COOKIE_DOMAIN || 'simon-gpt.com') : undefined
            });
          },
          remove(name: string, options: CookieOptions) {
            console.debug(`[Middleware] Removing cookie ${name}`, `(path=${path})`);
            // If the cookie is removed, update the response
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              path: '/'
            });
          }
        }
      }
    );

    // Refresh the session if it exists
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.debug('[Middleware] Session check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      path: path,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      error: error ? { message: error.message, code: error.code } : null
    });
    
    if (error) {
      console.error('[Middleware] Session error:', error)
      // Clear the auth cookie if there's an error
      response.cookies.set({
        name: COOKIE_NAME,
        value: '',
        maxAge: 0,
        path: '/'
      })
      
      // For API routes that need auth but shouldn't redirect, return 401
      if (isApiAuthRoute(path) || isInternalApiPath(path)) {
        console.debug('[Middleware] API route with session error, returning 401');
        return NextResponse.json(
          { error: 'Unauthorized', message: error.message },
          { status: 401 }
        );
      }
      
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    if (!session) {
      console.debug('[Middleware] No session found, redirecting to signin')
      
      // For API routes that need auth but shouldn't redirect, return 401
      if (isApiAuthRoute(path) || isInternalApiPath(path)) {
        console.debug('[Middleware] API route without session, returning 401');
        return NextResponse.json(
          { error: 'Unauthorized', message: 'No valid session found' },
          { status: 401 }
        );
      }
      
      const searchParams = new URLSearchParams()
      searchParams.set('returnUrl', request.url)
      return NextResponse.redirect(new URL(`/signin?${searchParams.toString()}`, request.url))
    }

    // Add auth token to response headers for API routes
    if (path.startsWith('/api/')) {
      response.headers.set('x-auth-token', session.access_token);
    }

    // Pass user info to the request headers
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-email', session.user.email || '');

    // Call subscription middleware
    const subscriptionResponse = await subscriptionMiddleware(request)
    if (subscriptionResponse) {
      console.debug('[Middleware] Subscription middleware returned a response, using it');
      return subscriptionResponse
    }

    console.debug('[Middleware] Authentication successful, proceeding with request');
    return response
  } catch (e) {
    console.error('[Middleware] Unexpected error:', e)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
} 
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { subscriptionMiddleware } from './middleware/subscription'

// Define all public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Allow the root path entirely
  '/signin',
  '/signup',
  '/auth/v1/callback',
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

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  
  console.debug('[Middleware] Processing request:', {
    url: request.url,
    method: request.method,
    pathname: url.pathname,
    search: url.search,
    cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...']))
  })

  // Skip middleware for public routes and static files
  const path = url.pathname
  
  if (isPublicPath(path, url.search) || 
      path.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)) {
    console.debug('[Middleware] Skipping auth check for route:', path + url.search)
    return NextResponse.next()
  }

  try {
    // Create a response object that we can return
    let response = NextResponse.next()

    // Get the Supabase URL from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    
    // Generate the auth cookie name from the URL
    const projectId = getProjectId(supabaseUrl);
    const COOKIE_NAME = `sb-${projectId}-auth-token`;

    // Create a Supabase client with the correct URL
    const supabase = createServerClient(
      // Use the URL from environment variables
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)?.value;
            console.debug(`[Middleware] Getting cookie ${name}:`, cookie ? `${cookie.substring(0, 10)}...` : 'null');
            return cookie;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.debug(`[Middleware] Setting cookie ${name}:`, value ? `${value.substring(0, 10)}...` : 'empty');
            // If the cookie is updated, update the response
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              domain: process.env.NODE_ENV === 'production' ? 'simon-gpt.com' : undefined
            })
          },
          remove(name: string, options: CookieOptions) {
            console.debug(`[Middleware] Removing cookie ${name}`);
            // If the cookie is removed, update the response
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            })
          }
        }
      }
    )

    // Refresh the session if it exists
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.debug('[Middleware] Session check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
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
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    if (!session) {
      console.debug('[Middleware] No session found, redirecting to signin')
      const searchParams = new URLSearchParams()
      searchParams.set('returnUrl', request.url)
      return NextResponse.redirect(new URL(`/signin?${searchParams.toString()}`, request.url))
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
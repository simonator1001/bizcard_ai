import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { subscriptionMiddleware } from './middleware/subscription'

const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/auth/callback',
  '/auth/v1/callback',
  '/reset-password',
  '/verify',
  '/api/auth',
  '/api/scan',
  '/api/ocr',
  '/api/extract-info'
]

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'experimental-edge'
}

export async function middleware(request: NextRequest) {
  try {
    // Create a response object that we can modify
    const res = NextResponse.next();

    // Create the Supabase client with error handling
    let supabase;
    try {
      supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.delete({
              name,
              ...options,
            });
          },
        },
      }
    );
    } catch (error) {
      console.error('[Middleware] Error creating Supabase client:', error);
      return res;
    }

    // Check if the route is public
    const requestPath = new URL(request.url).pathname;
    const isPublicRoute = PUBLIC_ROUTES.some(route => requestPath.startsWith(route));

    if (isPublicRoute) {
      return res;
    }

    // Get authenticated user data with error handling
    let user;
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[Middleware] Authentication error:', userError);
        // Don't return error for API routes
        if (!requestPath.startsWith('/api/')) {
          const redirectUrl = new URL('/signin', request.url);
          redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
      user = authUser;
    } catch (error) {
      console.error('[Middleware] Error getting user:', error);
      return res;
    }

    // Handle authentication for protected routes
    const isAuthPage = requestPath.startsWith('/auth') || requestPath === '/signin' || requestPath === '/signup';
    const isProtectedRoute = !isAuthPage && 
      !requestPath.startsWith('/api') && 
      !requestPath.startsWith('/_next') &&
      !requestPath.startsWith('/static');

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && user && !requestPath.includes('/callback')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (!isPublicRoute && user) {
      try {
        // Apply subscription middleware only for authenticated non-public routes
        return await subscriptionMiddleware(request);
      } catch (error) {
        console.error('[Middleware] Subscription middleware error:', error);
        return res;
      }
    }

    return res;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // On error, allow the request to continue but log the error
    return NextResponse.next();
  }
} 
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { subscriptionMiddleware } from './middleware/subscription'

const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/auth/callback',
  '/reset-password',
  '/verify',
  '/api/auth'
]

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'experimental-edge'
}

export async function middleware(request: NextRequest) {
  try {
    // Create a response object that we can modify
    const res = NextResponse.next();

    // Create the Supabase client
    const supabase = createServerClient(
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

    // Get authenticated user data
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[Middleware] Authentication error:', userError);
      return res;
    }

    // Handle authentication for protected routes
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
    const isProtectedRoute = !isAuthPage && 
      !request.nextUrl.pathname.startsWith('/api') && 
      !request.nextUrl.pathname.startsWith('/_next') &&
      !request.nextUrl.pathname.startsWith('/static');

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && user) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check if the route is public
    const requestPath = new URL(request.url).pathname;
    const isPublicRoute = PUBLIC_ROUTES.some(route => requestPath.startsWith(route));

    if (!isPublicRoute && user) {
      // Apply subscription middleware only for authenticated non-public routes
      return subscriptionMiddleware(request);
    }

    return res;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // On error, allow the request to continue but log the error
    return NextResponse.next();
  }
} 
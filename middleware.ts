import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// All public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/auth/callback',
  '/callback',
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
  '/payment/success',
  '/companies',
  '/companies/',
  '/intel',
  '/voice',
]

// API routes that always pass through (handle their own auth)
const INTERNAL_API_ROUTES = [
  '/api/ocr',
  '/api/extract-info',
]

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

// Check if path is public
function isPublicPath(path: string): boolean {
  const normalizedPath = path.replace(/\/$/, '')
  if (normalizedPath === '') return true
  return PUBLIC_ROUTES.some(
    route => normalizedPath === route || normalizedPath.startsWith(route + '/')
  )
}

// Check if path is a static asset
function isStaticAsset(path: string): boolean {
  return /\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/.test(path)
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname

  // Always allow public routes and static assets
  if (isPublicPath(path) || isStaticAsset(path)) {
    return NextResponse.next()
  }

  // For API routes, pass through — handlers manage their own auth
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // AppWrite auth is client-side — we can't check sessions server-side.
  // Let the client-side AuthProvider handle redirects to signin.
  // All non-public, non-API routes pass through here.
  return NextResponse.next()
}

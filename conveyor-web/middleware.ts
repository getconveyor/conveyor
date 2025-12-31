import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password']

// Define auth routes (redirect to dashboard if already logged in)
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get tokens from cookies (we'll set these client-side)
  // For now, check if user has auth in localStorage (this is handled client-side)
  // Since middleware runs on server, we'll use a different approach

  // For now, we'll handle this client-side in the layout
  // This middleware can be extended later for server-side checks

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

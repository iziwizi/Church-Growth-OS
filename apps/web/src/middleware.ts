import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware — Pass-through middleware for App Router.
 * Authentication & Church Onboarding route guards are handled client-side
 * by AuthInitializer using Firebase Authentication & Firestore.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files & favicon
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

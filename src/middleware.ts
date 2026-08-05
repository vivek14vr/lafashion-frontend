import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isLoginRoute = pathname === '/login'

  if (!isAdminRoute && !isLoginRoute) return NextResponse.next()

  // Authentication is verified client-side by AdminApp through the same-origin
  // Payload endpoints. Avoid a server-to-server cookie check here: the browser
  // receives the auth cookie from the login POST, then follows the redirect to
  // /admin, where the client can present that cookie directly to Nginx/Payload.
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}

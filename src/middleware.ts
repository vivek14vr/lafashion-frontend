import { NextRequest, NextResponse } from 'next/server'

function backendOrigin(): string {
  return (process.env.PAYLOAD_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isLoginRoute = pathname === '/login'

  if (!isAdminRoute && !isLoginRoute) return NextResponse.next()

  let authenticated = false
  try {
    // Payload's auth cookie contains its signed JWT. The backend verifies the
    // signature and expiry before returning the current user.
    const response = await fetch(`${backendOrigin()}/api/users/me`, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store',
    })
    const payload = (await response.json().catch(() => null)) as { user?: unknown } | null
    authenticated = response.ok && Boolean(payload?.user)
  } catch {
    // Fail closed for the protected admin surface when the auth service is down.
    authenticated = false
  }

  if (isAdminRoute && !authenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginRoute && authenticated) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}

import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isLoginRoute = pathname === '/login'

  if (!isAdminRoute && !isLoginRoute) return NextResponse.next()

  if (isAdminRoute) {
    const backendUrl = (process.env.PAYLOAD_BACKEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
    const cookie = request.headers.get('cookie')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(`${backendUrl}/api/users/me`, {
        headers: cookie ? { cookie } : {},
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!response.ok) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      // Fail closed if the auth service is unavailable. Never render an admin
      // route when the server cannot verify the session.
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}

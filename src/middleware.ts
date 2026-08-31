import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isLoginRoute = pathname === '/login'

  if (!isAdminRoute && !isLoginRoute) return NextResponse.next()

  if (isAdminRoute || isLoginRoute) {
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
      const body = await response.json().catch(() => null) as { user?: unknown } | null
      console.info(`[admin auth middleware] path=${pathname} cookie=${Boolean(cookie)} backend=${response.status} user=${Boolean(body?.user)}`)
      if (!response.ok || !body?.user) {
        if (isLoginRoute) return NextResponse.next()
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
        return NextResponse.redirect(loginUrl)
      }
      if (isLoginRoute) {
        const requestedNext = request.nextUrl.searchParams.get('next') || '/admin'
        const destination = requestedNext === '/admin' || requestedNext.startsWith('/admin/')
          ? requestedNext
          : '/admin'
        return NextResponse.redirect(new URL(destination, request.url))
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

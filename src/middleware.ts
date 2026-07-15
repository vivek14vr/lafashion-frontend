import { NextRequest, NextResponse } from 'next/server'

function backendOrigin(): string {
  const raw = process.env.PAYLOAD_BACKEND_URL || 'http://localhost:3001'
  return raw.replace(/\/$/, '')
}

/**
 * Payload admin (proxied at /admin) loads /_next/* chunks that belong to the CMS
 * app. When the request comes from an admin page, rewrite those to the backend.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const referer = request.headers.get('referer') || ''
  const fromAdmin = referer.includes('/admin')

  if (!fromAdmin) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/payload-style.css') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg'
  ) {
    return NextResponse.rewrite(new URL(`${pathname}${search}`, `${backendOrigin()}/`))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/_next/:path*', '/payload-style.css', '/favicon.ico', '/favicon.svg'],
}

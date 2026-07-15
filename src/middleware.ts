import { NextRequest, NextResponse } from 'next/server'

const PAYLOAD_BACKEND_URL = process.env.PAYLOAD_BACKEND_URL || 'http://localhost:3001'

/**
 * Payload admin (proxied at /admin) loads Next.js chunks from /_next/*.
 * Those must hit the CMS app, not this site's bundles — route by Referer.
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
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/favicon.svg')
  ) {
    return NextResponse.rewrite(new URL(`${pathname}${search}`, PAYLOAD_BACKEND_URL))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/_next/:path*', '/payload-style.css', '/favicon.ico', '/favicon.svg'],
}

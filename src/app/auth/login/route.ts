import { NextRequest } from 'next/server'

const backendUrl = (process.env.PAYLOAD_BACKEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

function normalizeAuthCookie(value: string, hostname: string): string {
  // Payload's serializer can emit boolean cookie attributes as
  // `Secure=true` and `HttpOnly=true`, while browsers expect both attributes
  // to be flags. Normalize them before returning the cookie from this
  // same-origin login endpoint.
  let cookie = value
    .replace(/;\s*Secure(?:=true)?(?=;|$)/gi, '; Secure')
    .replace(/;\s*HttpOnly(?:=true)?(?=;|$)/gi, '; HttpOnly')

  // Keep the session available on both the apex and www hostnames in
  // production. Do not add a production domain when running locally.
  if (hostname.endsWith('lafashioncloset.com')) {
    if (/;\s*Domain=/i.test(cookie)) {
      cookie = cookie.replace(/;\s*Domain=[^;]*/gi, '; Domain=.lafashioncloset.com')
    } else {
      cookie += '; Domain=.lafashioncloset.com'
    }
  }

  return cookie
}

export async function POST(request: NextRequest) {
  const response = await fetch(`${backendUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': request.headers.get('content-type') || 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  })

  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': response.headers.get('content-type') || 'application/json',
  })
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie
  const setCookies = getSetCookie?.call(response.headers) || []
  const fallbackCookie = response.headers.get('set-cookie')
  const cookies = setCookies.length ? setCookies : fallbackCookie ? [fallbackCookie] : []
  for (const cookie of cookies) {
    headers.append('set-cookie', normalizeAuthCookie(cookie, request.nextUrl.hostname))
  }

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers,
  })
}

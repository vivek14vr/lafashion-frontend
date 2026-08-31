import { NextRequest } from 'next/server'

const backendUrl = (process.env.PAYLOAD_BACKEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

function normalizeAuthCookie(value: string): string {
  // Payload's serializer can emit `Secure=true`, while browsers expect the
  // Secure attribute to be a flag. Normalize it before returning the cookie
  // from this same-origin login endpoint.
  return value
    .replace(/;\s*Secure(?:=true)?/gi, '; Secure')
    .replace(/;\s*Domain=[^;]*/gi, '; Domain=.lafashioncloset.com')
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
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) headers.set('set-cookie', normalizeAuthCookie(setCookie))

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers,
  })
}

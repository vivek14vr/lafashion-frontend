import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Admin login',
  robots: { index: false, follow: false },
}

/**
 * Prefer a direct CMS admin URL in production (avoids /_next asset proxy issues).
 * Fallback: same-origin /admin (proxied to Payload).
 */
export default function LoginPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || '/admin'
  redirect(adminUrl)
}

import type { Metadata } from 'next'
import { AdminLogin } from '@/components/admin/admin-login'

export const metadata: Metadata = {
  title: 'Admin login',
  robots: { index: false, follow: false },
}

/**
 * Prefer a direct CMS admin URL in production (avoids /_next asset proxy issues).
 * Fallback: same-origin /admin (proxied to Payload).
 */
export default function LoginPage() {
  return <AdminLogin />
}

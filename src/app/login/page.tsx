import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Admin login',
  robots: { index: false, follow: false },
}

/** Entry portal — Payload owns the login UI at /admin */
export default function LoginPage() {
  redirect('/admin')
}

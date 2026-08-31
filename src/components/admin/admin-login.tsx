'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) throw new Error('Invalid email or password.')
      const next = new URLSearchParams(window.location.search).get('next') || '/admin'
      const destination = next === '/admin' || next.startsWith('/admin/') ? next : '/admin'
      // Force the server to evaluate the newly issued HttpOnly cookie before
      // rendering the protected route. A client transition can race the
      // cookie write and leave the user on the login screen.
      window.location.replace(destination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <Link href="/" className="admin-login__logo">
          <Image src="/logo.png" alt="LA Fashion Closet" width={260} height={80} priority unoptimized />
        </Link>
        <div className="admin-login__heading">
          <p className="admin-eyebrow">CONTENT STUDIO</p>
          <h1>Welcome back</h1>
          <p className="admin-muted">Sign in to manage the website, registrations, and media library.</p>
        </div>
        <form onSubmit={submit} className="admin-form">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button className="admin-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<span aria-hidden>↗</span></button>
        </form>
        <div className="admin-login__footer"><span>Authorized team members only</span><Link href="/">Return to website</Link></div>
      </div>
    </main>
  )
}

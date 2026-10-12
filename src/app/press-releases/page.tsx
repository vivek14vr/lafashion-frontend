import type { Metadata } from 'next'
import { PressReleasesGrid } from '@/components/press-releases-grid'
import { getPressReleases } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Press Releases',
  description: 'Meet the designers and creative voices participating in LA Fashion Closet shows.',
}

export const dynamic = 'force-dynamic'

export default async function PressReleasesPage() {
  const initialPage = await getPressReleases().catch(() => null)
  return <div className="bg-[var(--background)]"><div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]"><div className="mx-auto max-w-6xl px-6 pb-12 pt-28"><p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">The designers</p><h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-5xl text-[var(--cream)] md:text-7xl">Press releases</h1><p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">Discover the designers, labels, and creative perspectives coming to the LA Fashion Closet runway.</p></div></div><div className="mx-auto max-w-6xl px-6 pb-24 pt-10"><PressReleasesGrid initialPage={initialPage} /></div></div>
}

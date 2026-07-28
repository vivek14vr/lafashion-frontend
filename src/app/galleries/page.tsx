import type { Metadata } from 'next'
import { GalleriesGrid } from '@/components/galleries-grid'

export const metadata: Metadata = {
  title: 'Galleries',
  description: 'Past LA Fashion Closet shows in photographs.',
}

export default function GalleriesPage() {
  return (
    <div className="bg-[var(--background)]">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-28">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Archive</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--cream)] md:text-6xl">
            Our gallery
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
            Photos from runway nights and productions — including past shows that were never listed
            on this site.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <GalleriesGrid />
      </div>
    </div>
  )
}

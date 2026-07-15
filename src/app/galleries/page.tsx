import type { Metadata } from 'next'
import { GalleriesGrid } from '@/components/galleries-grid'

export const metadata: Metadata = {
  title: 'Galleries',
  description: 'Past LA Fashion Closet shows in photographs.',
}

export default function GalleriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-28">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Archive</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--cream)] md:text-6xl">
          Past event galleries
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          Photos from runway nights and productions — including past shows that were never listed on
          this site.
        </p>
      </div>
      <div className="mt-12">
        <GalleriesGrid />
      </div>
    </div>
  )
}

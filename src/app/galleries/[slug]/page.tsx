import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { GalleryLightbox } from '@/components/gallery-lightbox'
import { getGalleryBySlug } from '@/lib/api'
import { normalizeGalleryImages } from '@/lib/gallery'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const gallery = await getGalleryBySlug(slug).catch(() => null)
  if (!gallery) return { title: 'Gallery' }
  return {
    title: gallery.title,
    description: gallery.excerpt || `Photos from ${gallery.title}`,
  }
}

function formatGalleryDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default async function GalleryDetailPage({ params }: Props) {
  const { slug } = await params
  const gallery = await getGalleryBySlug(slug).catch(() => null)

  if (!gallery) notFound()

  const images = normalizeGalleryImages(gallery.images)
  const linkedEvent =
    gallery.event && typeof gallery.event === 'object' ? gallery.event : null
  const location = gallery.location || linkedEvent?.venue || null
  const date = gallery.date || linkedEvent?.date || null

  return (
    <div className="bg-[var(--background)]">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-28">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">
            {gallery.source === 'platform' ? 'Event gallery' : 'Past show'}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--cream)] md:text-6xl">
            {gallery.title}
          </h1>

          {(date || location) && (
            <div className="mt-5 flex flex-col gap-2 text-sm text-[var(--muted)]">
              {date ? (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} className="text-[var(--champagne)]" />
                  {formatGalleryDate(date)}
                </span>
              ) : null}
              {location ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} className="text-[var(--champagne)]" />
                  {location}
                </span>
              ) : null}
            </div>
          )}

          {gallery.excerpt ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--cream)]/75">
              {gallery.excerpt}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-4">
            {linkedEvent?.slug ? (
              <Link
                href={`/events/${linkedEvent.slug}`}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--champagne)] transition hover:text-[var(--cream)]"
              >
                Related event
                <ArrowUpRight size={16} />
              </Link>
            ) : null}
            <Link
              href="/galleries"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)]/70 transition hover:text-[var(--champagne)]"
            >
              All galleries
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full px-3 py-8 md:px-4 md:py-10 lg:px-5">
        {images.length ? (
          <GalleryLightbox images={images} />
        ) : (
          <div className="mx-auto max-w-6xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-16 text-center">
            <p className="text-[var(--muted)]">No photos in this gallery yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, MapPin } from 'lucide-react'
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
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-28">
      <div className="max-w-2xl">
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
                <CalendarDays size={15} />
                {formatGalleryDate(date)}
              </span>
            ) : null}
            {location ? (
              <span className="inline-flex items-center gap-2">
                <MapPin size={15} />
                {location}
              </span>
            ) : null}
          </div>
        )}
        {gallery.excerpt ? (
          <p className="mt-5 text-base leading-relaxed text-[var(--cream)]/75">{gallery.excerpt}</p>
        ) : null}
      </div>
      <div className="mt-12">
        {images.length ? (
          <GalleryLightbox images={images} />
        ) : (
          <p className="text-[var(--muted)]">No photos in this gallery yet.</p>
        )}
      </div>
    </div>
  )
}

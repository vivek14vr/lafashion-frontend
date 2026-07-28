'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { formatEventDate, getGalleryForEvent, getMediaUrl, isEventPast } from '@/lib/api'
import type { EventItem } from '@/lib/types'
import { OrnateGoldFrame } from '@/components/ornate-gold-frame'

export function EventCard({ event, index = 0 }: { event: EventItem; index?: number }) {
  const uid = useId().replace(/:/g, '')
  const imageUrl = getMediaUrl(event.portraitImage) || getMediaUrl(event.bannerImage)
  const imageAlt =
    typeof event.portraitImage === 'object' && event.portraitImage?.alt
      ? event.portraitImage.alt
      : event.title

  const past = isEventPast(event)
  const raised = index % 2 === 1

  const galleryQuery = useQuery({
    queryKey: ['gallery-for-event', event.id],
    queryFn: () => getGalleryForEvent(event.id),
    enabled: past,
  })

  const gallerySlug = galleryQuery.data?.slug

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: Math.min(index, 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`group grid items-center gap-8 rounded-2xl border border-[var(--border-subtle)] px-5 py-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12 md:px-8 md:py-10 ${
        raised ? 'bg-[var(--surface-raised)]' : 'bg-[var(--surface)]'
      }`}
    >
      <Link href={`/events/${event.slug}`} className="relative mx-auto block w-full max-w-md md:mx-0 md:max-w-none">
        <div className="relative aspect-[3/4] w-full">
          <div className="absolute inset-[4.5%] overflow-hidden rounded-xl bg-[var(--surface-muted)]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                No image
              </div>
            )}
          </div>
          <OrnateGoldFrame uid={uid} />
        </div>
      </Link>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--champagne)]">
          {past ? 'Past event' : 'Upcoming'}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--cream)] md:text-5xl">
          <Link href={`/events/${event.slug}`} className="transition hover:text-[var(--champagne)]">
            {event.title}
          </Link>
        </h2>

        <div className="mt-5 h-px w-14 bg-[var(--champagne)]/45" />

        <div className="mt-5 flex flex-col gap-2 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={15} className="text-[var(--champagne)]" />
            {formatEventDate(event.date)}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={15} className="text-[var(--champagne)]" />
            {event.venue}
          </span>
        </div>

        {event.excerpt ? (
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--cream)]/75">
            {event.excerpt}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)] transition hover:text-[var(--champagne)]"
          >
            Details
            <ArrowUpRight size={16} />
          </Link>

          {past ? (
            gallerySlug ? (
              <Link
                href={`/galleries/${gallerySlug}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--champagne)]/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--champagne)] transition hover:border-[var(--champagne)] hover:bg-[var(--champagne)] hover:text-[#14120f]"
              >
                Gallery
                <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link
                href="/galleries"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--champagne)]/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--champagne)] transition hover:border-[var(--champagne)] hover:bg-[var(--champagne)] hover:text-[#14120f]"
              >
                Gallery
                <ArrowUpRight size={16} />
              </Link>
            )
          ) : event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--champagne)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
            >
              Book tickets
              <ArrowUpRight size={16} />
            </a>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}

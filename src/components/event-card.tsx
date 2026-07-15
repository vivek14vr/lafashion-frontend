'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { formatEventDate, getMediaUrl } from '@/lib/api'
import type { EventItem } from '@/lib/types'

export function EventCard({ event, index = 0 }: { event: EventItem; index?: number }) {
  const imageUrl = getMediaUrl(event.portraitImage)
  const imageAlt =
    typeof event.portraitImage === 'object' && event.portraitImage?.alt
      ? event.portraitImage.alt
      : event.title

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group grid gap-5 border-b border-white/10 py-8 md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-10"
    >
      <Link href={`/events/${event.slug}`} className="relative block overflow-hidden">
        <div className="relative aspect-[3/4] max-h-[520px] overflow-hidden bg-[#17181c] md:max-h-none">
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
      </Link>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--champagne)]">
          {event.status === 'upcoming' ? 'Upcoming' : 'Past event'}
        </p>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--cream)] md:text-4xl">
          <Link href={`/events/${event.slug}`} className="transition hover:text-[var(--champagne)]">
            {event.title}
          </Link>
        </h3>
        <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={15} />
            {formatEventDate(event.date)}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={15} />
            {event.venue}
          </span>
        </div>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--cream)]/75">
          {event.excerpt}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)] transition hover:text-[var(--champagne)]"
          >
            Details
            <ArrowUpRight size={16} />
          </Link>
          {event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--champagne)] px-4 py-2 text-sm font-medium text-[#14120f] transition hover:bg-[var(--cream)]"
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

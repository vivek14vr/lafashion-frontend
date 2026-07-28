'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useId } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { formatEventDate, getMediaUrl } from '@/lib/api'
import type { EventItem } from '@/lib/types'
import { OrnateGoldFrame } from '@/components/ornate-gold-frame'

function UpcomingEventCard({ event, index }: { event: EventItem; index: number }) {
  const uid = useId().replace(/:/g, '')
  const imageUrl = getMediaUrl(event.portraitImage) || getMediaUrl(event.bannerImage)

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
        <div className="absolute inset-[4.5%] flex flex-col overflow-hidden rounded-xl bg-[#0c0d0f]">
          <Link href={`/events/${event.slug}`} className="relative min-h-0 flex-1 overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={event.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#17181c] text-sm text-[var(--muted)]">
                No image
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/50 to-transparent"
              aria-hidden
            />
          </Link>

          <div className="relative z-[1] -mt-16 space-y-3 px-5 pb-6 pt-2 text-center sm:px-6 sm:pb-7">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--champagne)]">Upcoming</p>
            <h3 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--cream)] sm:text-3xl">
              <Link href={`/events/${event.slug}`} className="transition hover:text-[var(--champagne)]">
                {event.title}
              </Link>
            </h3>

            <div className="mx-auto h-px w-12 bg-[var(--champagne)]/50" />

            <div className="flex flex-col items-center gap-1.5 text-xs text-[var(--cream)]/75 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={14} className="text-[var(--champagne)]" />
                {formatEventDate(event.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={14} className="text-[var(--champagne)]" />
                {event.venue}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/events/${event.slug}`}
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--cream)] transition hover:text-[var(--champagne)]"
              >
                Details
                <ArrowUpRight size={14} />
              </Link>
              {event.ticketUrl ? (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--champagne)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
                >
                  Book tickets
                  <ArrowUpRight size={14} />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <OrnateGoldFrame uid={uid} />
      </div>
    </motion.article>
  )
}

type Props = {
  events: EventItem[]
  loading?: boolean
}

export function UpcomingEventsSection({ events, loading }: Props) {
  const latest = events.slice(0, 2)

  return (
    <section className="bg-[var(--background)] px-4 py-20 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-2xl md:mb-14"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">
            Next on the calendar
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] md:text-5xl">
            Upcoming nights
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
            Two dates worth dressing for — book early, arrive ready for the room.
          </p>
        </motion.div>

        {loading ? (
          <p className="text-[var(--muted)]">Loading events…</p>
        ) : latest.length > 0 ? (
          <div
            className={`mx-auto grid gap-6 md:gap-8 ${
              latest.length === 1 ? 'max-w-md md:max-w-lg' : 'md:grid-cols-2'
            }`}
          >
            {latest.map((event, index) => (
              <UpcomingEventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="border border-white/10 px-6 py-14 text-center">
            <p className="text-[var(--muted)]">No upcoming events yet. Check back soon.</p>
            <Link
              href="/events"
              className="mt-4 inline-flex text-sm uppercase tracking-[0.16em] text-[var(--champagne)]"
            >
              Browse calendar
            </Link>
          </div>
        )}

        {events.length > 0 ? (
          <div className="mt-12 text-center md:mt-14">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)]/70 transition hover:text-[var(--champagne)]"
            >
              See all upcoming events
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { formatEventDate, getGalleries, getMediaUrl, getUpcomingEvents } from '@/lib/api'
import { FashionBeyondBordersHero } from '@/components/fashion-beyond-borders-hero'
import type { DestinationWithImages } from '@/lib/home-carousel'
import { normalizeGalleryImages } from '@/lib/gallery'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
}

export function HomePage({ destinations }: { destinations: DestinationWithImages[] }) {
  const eventsQuery = useQuery({
    queryKey: ['events', 'upcoming', 'home'],
    queryFn: () => getUpcomingEvents(),
  })
  const galleriesQuery = useQuery({
    queryKey: ['galleries', 'home'],
    queryFn: () => getGalleries(),
  })

  const featured = eventsQuery.data?.docs[0] ?? null
  const galleries = galleriesQuery.data?.docs.slice(0, 3) ?? []

  return (
    <div>
      <FashionBeyondBordersHero destinations={destinations} />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div {...fadeUp} className="mb-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Next on the calendar</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--cream)] md:text-5xl">
            Upcoming nights
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
            Reserve through our partners, dress for the room, and step into a production built for the
            global stage.
          </p>
        </motion.div>

        {eventsQuery.isLoading ? (
          <p className="text-[var(--muted)]">Loading events…</p>
        ) : featured ? (
          <motion.article
            {...fadeUp}
            className="grid items-stretch gap-8 border border-white/10 md:grid-cols-[0.9fr_1.1fr]"
          >
            <Link href={`/events/${featured.slug}`} className="relative min-h-[420px] overflow-hidden bg-[#17181c]">
              {getMediaUrl(featured.portraitImage) || getMediaUrl(featured.bannerImage) ? (
                <Image
                  src={
                    getMediaUrl(featured.portraitImage) ||
                    getMediaUrl(featured.bannerImage) ||
                    ''
                  }
                  alt={featured.title}
                  fill
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 45vw"
                />
              ) : null}
            </Link>
            <div className="flex flex-col justify-center px-6 py-10 md:pr-10">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--champagne)]">Upcoming</p>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--cream)] md:text-5xl">
                <Link href={`/events/${featured.slug}`} className="hover:text-[var(--champagne)]">
                  {featured.title}
                </Link>
              </h3>
              <div className="mt-5 flex flex-col gap-2 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} />
                  {formatEventDate(featured.date)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} />
                  {featured.venue}
                </span>
              </div>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--cream)]/75">
                {featured.excerpt}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/events/${featured.slug}`}
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)] transition hover:text-[var(--champagne)]"
                >
                  Details
                  <ArrowUpRight size={16} />
                </Link>
                {featured.ticketUrl ? (
                  <a
                    href={featured.ticketUrl}
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
        ) : (
          <div className="border border-white/10 px-6 py-14">
            <p className="text-[var(--muted)]">No upcoming events yet. Check back soon.</p>
            <Link
              href="/events"
              className="mt-4 inline-flex text-sm uppercase tracking-[0.16em] text-[var(--champagne)]"
            >
              Browse calendar
            </Link>
          </div>
        )}

        {eventsQuery.data && eventsQuery.data.docs.length > 1 ? (
          <div className="mt-10">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)]/70 transition hover:text-[var(--champagne)]"
            >
              See all upcoming events
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : null}
      </section>

      <section className="border-y border-white/10 bg-[var(--background)]">
        <motion.div {...fadeUp} className="mx-auto max-w-6xl px-6 py-28">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">The experience</p>
          <h2 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl text-[var(--cream)] md:text-6xl">
            Fashion is more than clothing — it is art, culture, and timeless elegance.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--cream)]/75 md:text-lg">
            LA Fashion Closet produces luxury runway nights and Fashion Beyond Borders tours that
            blend creativity with a global stage — from New Delhi to Los Angeles, Paris to Cannes.
          </p>
          <Link
            href="/about"
            className="mt-10 inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--champagne)] transition hover:text-[var(--cream)]"
          >
            About the house
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div {...fadeUp} className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Archive</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--cream)] md:text-5xl">
              Past shows
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Revisit runway nights, festival productions, and moments that define the LA Fashion
              Closet stage.
            </p>
          </div>
          <Link
            href="/galleries"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)]/70 transition hover:text-[var(--champagne)]"
          >
            All galleries
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>

        {galleriesQuery.isLoading ? (
          <p className="text-[var(--muted)]">Loading galleries…</p>
        ) : galleries.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {galleries.map((gallery, index) => {
              const first = normalizeGalleryImages(gallery.images)[0]
              const imageUrl = getMediaUrl(gallery.coverImage) || getMediaUrl(first?.image)
              return (
                <motion.div
                  key={gallery.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                >
                  <Link href={`/galleries/${gallery.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#17181c]">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={gallery.title}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-[1.04]"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)]">
                          {gallery.title}
                        </h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--champagne)]">
                          View gallery
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="border border-white/10 px-6 py-14">
            <p className="text-[var(--muted)]">
              Past show galleries will appear here once published in admin.
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-white/10 bg-[var(--background)]">
        <motion.div
          {...fadeUp}
          className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Join the night</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--cream)] md:text-5xl">
              Ready for the next production?
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Explore upcoming dates, book through our partners, or reach the house directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--champagne)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
            >
              View events
              <ArrowUpRight size={16} />
            </Link>
            <a
              href="https://www.instagram.com/lafashioncloset"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm uppercase tracking-[0.14em] text-[var(--cream)] transition hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
            >
              @lafashioncloset
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

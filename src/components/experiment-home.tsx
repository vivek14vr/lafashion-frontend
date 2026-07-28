'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { getGalleries, getMediaUrl, getUpcomingEvents } from '@/lib/api'
import type { DestinationWithImages } from '@/lib/home-carousel'
import { DestinationsCarouselSection } from '@/components/destinations-carousel-section'
import { OrnateGoldFrame } from '@/components/ornate-gold-frame'
import { UpcomingEventsSection } from '@/components/upcoming-events-section'
import { WorldMapHero } from '@/components/world-map-hero'
import { normalizeGalleryImages } from '@/lib/gallery'
import type { GalleryItem } from '@/lib/types'

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
}

function GalleryShowcaseCard({ gallery, index }: { gallery: GalleryItem; index: number }) {
  const uid = useId().replace(/:/g, '')
  const first = normalizeGalleryImages(gallery.images)[0]
  const imageUrl = getMediaUrl(gallery.coverImage) || getMediaUrl(first?.image)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/galleries/${gallery.slug}`} className="group relative block">
        <div className="relative aspect-[3/4] w-full">
          <div className="absolute inset-[4.5%] overflow-hidden rounded-xl bg-[#0c0d0f]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={gallery.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                No image
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-center md:p-6">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)] transition group-hover:text-[var(--champagne)] md:text-3xl">
                {gallery.title}
              </h3>
              <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-[var(--champagne)]">
                View gallery
              </p>
            </div>
          </div>
          <OrnateGoldFrame uid={uid} />
        </div>
      </Link>
    </motion.div>
  )
}

/** Home: world-map hero + snaps, events, story, archive, CTA */
export function ExperimentHome({ destinations }: { destinations: DestinationWithImages[] }) {
  const eventsQuery = useQuery({
    queryKey: ['events', 'upcoming', 'home'],
    queryFn: () => getUpcomingEvents({ limit: 2 }),
  })
  const galleriesQuery = useQuery({
    queryKey: ['galleries', 'home'],
    queryFn: () => getGalleries({ limit: 3 }),
  })

  const galleries = galleriesQuery.data?.docs.slice(0, 3) ?? []
  const upcomingEvents = eventsQuery.data?.docs ?? []

  return (
    <div>
      <div className="relative z-0 h-[100svh]">
        <div className="fixed inset-x-0 top-0 z-0 h-[100svh]">
          <WorldMapHero />
        </div>
      </div>

      <div className="relative z-10 bg-[var(--background)]">
        <DestinationsCarouselSection destinations={destinations} />

        <UpcomingEventsSection events={upcomingEvents} loading={eventsQuery.isLoading} />

        {/* Manifesto */}
        <section className="relative overflow-hidden bg-[var(--background)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(212,165,116,0.12), transparent 70%)',
            }}
            aria-hidden
          />
          <motion.div {...fadeUp} className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--champagne)]">The house</p>
            <div className="mx-auto mt-6 h-px w-16 bg-[var(--champagne)]/55" />
            <h2 className="mt-8 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5vw,3.75rem)] leading-[1.12] text-[var(--cream)]">
              Fashion is more than clothing — it is art, culture, and timeless elegance.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-relaxed text-[var(--cream)]/70 md:text-lg">
              LA Fashion Closet stages luxury runway nights and Fashion Beyond Borders tours — from
              New Delhi to Los Angeles, Mauritius to Paris and Cannes.
            </p>
            <Link
              href="/about"
              className="mt-10 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-[var(--champagne)] transition hover:text-[var(--cream)]"
            >
              About the house
              <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </section>

        {/* Archive */}
        <section className="bg-[var(--background)] px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <motion.div
              {...fadeUp}
              className="mb-12 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between"
            >
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Archive</p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] md:text-5xl">
                  Our gallery
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
                  Revisit runway nights, festival productions, and the moments that define the
                  stage.
                </p>
              </div>
              <Link
                href="/galleries"
                className="inline-flex shrink-0 items-center gap-2 text-sm uppercase tracking-[0.16em] text-[var(--cream)]/70 transition hover:text-[var(--champagne)]"
              >
                All galleries
                <ArrowUpRight size={16} />
              </Link>
            </motion.div>

            {galleriesQuery.isLoading ? (
              <p className="text-[var(--muted)]">Loading galleries…</p>
            ) : galleries.length ? (
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
                {galleries.map((gallery, index) => (
                  <GalleryShowcaseCard key={gallery.id} gallery={gallery} index={index} />
                ))}
              </div>
            ) : (
              <div className="border border-[var(--champagne)]/25 px-6 py-16 text-center">
                <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)]">
                  Galleries coming soon
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)]">
                  Past show galleries will appear here once published in admin.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative overflow-hidden border-t border-white/10 bg-[var(--background)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 80% at 80% 50%, rgba(212,165,116,0.1), transparent 65%)',
            }}
            aria-hidden
          />
          <motion.div
            {...fadeUp}
            className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-24 text-center md:py-28"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--champagne)]">
                Join the night
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--cream)] md:text-6xl">
                Ready for the next production?
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--muted)]">
                Explore upcoming dates, book through our partners, or follow the house on Instagram.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--champagne)] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
              >
                View events
                <ArrowUpRight size={16} />
              </Link>
              <a
                href="https://www.instagram.com/lafashioncloset"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--champagne)]/45 px-7 py-3.5 text-sm uppercase tracking-[0.14em] text-[var(--cream)] transition hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
              >
                @lafashioncloset
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

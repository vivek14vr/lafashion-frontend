'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { DestinationWithImages } from '@/lib/home-carousel'
import { DestinationCardCarousel } from '@/components/destination-card-carousel'

type Props = {
  destinations: DestinationWithImages[]
}

export function DestinationsCarouselSection({ destinations }: Props) {
  if (!destinations.length) return null

  return (
    <section className="bg-[var(--background)] pt-12 pb-14 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24">
      <div className="mx-auto mb-8 max-w-[1600px] px-4 md:mb-12 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">
              Fashion Beyond Borders
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[1.75rem] leading-tight text-[var(--cream)] sm:text-3xl md:text-5xl">
              Our snaps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:mt-4 sm:text-[15px]">
              Five cities. One vision. A living album from the global stage.
            </p>
          </div>
          <Link
            href="/galleries"
            className="inline-flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--cream)]/70 transition hover:text-[var(--champagne)] sm:text-sm"
          >
            Browse galleries
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-2.5 px-3 sm:grid-cols-3 sm:gap-3 sm:px-4 md:grid-cols-3 md:gap-4 lg:grid-cols-5 lg:gap-5 lg:px-5">
        {destinations.map((destination, index) => (
          <motion.div
            key={destination.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            <DestinationCardCarousel destination={destination} staggerMs={index * 400} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

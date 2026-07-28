'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { DestinationWithImages } from '@/lib/home-carousel'
import { DestinationCardCarousel } from '@/components/destination-card-carousel'

type Props = {
  destinations: DestinationWithImages[]
}

export function FashionBeyondBordersHero({ destinations }: Props) {
  return (
    <section className="relative overflow-hidden bg-[#050506] pt-14 md:pt-16">
      <div className="relative mx-1.5 min-h-[58vh] overflow-hidden md:mx-2 md:min-h-[68vh] lg:mx-3">
        <Image
          src="/backimage.webp"
          alt="Fashion Beyond Borders by LA Fashion Closet"
          fill
          priority
          unoptimized
          className="object-cover object-top"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-transparent" />
      </div>

      <div className="relative z-20 mx-1.5 -mt-36 pb-16 md:mx-2 md:-mt-44 lg:mx-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mb-6 flex flex-wrap items-center justify-center gap-3 md:mb-8 md:gap-4"
        >
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--champagne)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
          >
            Upcoming events
            <ArrowUpRight size={16} />
          </Link>
          <Link
            href="/galleries"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#0c0d0f]/40 px-6 py-3 text-sm uppercase tracking-[0.14em] text-[var(--cream)] backdrop-blur-sm transition hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
          >
            Our gallery
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 + index * 0.07 }}
              className="min-w-0"
            >
              <DestinationCardCarousel destination={destination} staggerMs={index * 400} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

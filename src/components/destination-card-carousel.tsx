'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { DestinationWithImages } from '@/lib/home-carousel'

type Props = {
  destination: DestinationWithImages
  staggerMs?: number
}

export function DestinationCardCarousel({ destination, staggerMs = 0 }: Props) {
  const slides = destination.images
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 4200 + staggerMs)
    return () => window.clearInterval(id)
  }, [slides.length, staggerMs])

  const active = slides[index]

  return (
    <article className="flex h-full min-h-[300px] flex-col overflow-hidden border border-[var(--champagne)]/35 bg-[#0c0d0f]/45 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md md:min-h-[360px]">
      <div className="relative aspect-[4/5] w-full flex-1 overflow-hidden bg-[#17181c]/30">
        {active ? (
          <AnimatePresence mode="sync">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85 }}
              className="absolute inset-0"
            >
              <Image
                src={active}
                alt={`${destination.city} — Fashion Beyond Borders`}
                fill
                unoptimized={active.includes('cloudinary.com')}
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent px-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Add images in Admin
              <br />
              <span className="text-[var(--champagne)]/80">Home destination cards</span>
            </p>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0c0d0f]/50 to-transparent" />
      </div>

      <div className="border-t border-[var(--champagne)]/25 bg-[#0c0d0f]/35 px-3 py-4 text-center backdrop-blur-sm md:px-3.5 md:py-5">
        <h3 className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--champagne)] md:text-2xl">
          {destination.city}
        </h3>
      </div>
    </article>
  )
}

'use client'

import Image from 'next/image'
import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { DestinationWithImages } from '@/lib/home-carousel'
import { OrnateGoldFrame } from '@/components/ornate-gold-frame'

type Props = {
  destination: DestinationWithImages
  staggerMs?: number
}

export function DestinationCardCarousel({ destination, staggerMs = 0 }: Props) {
  const slides = destination.images
  const [index, setIndex] = useState(0)
  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    if (slides.length < 2) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 4200 + staggerMs)
    return () => window.clearInterval(id)
  }, [slides.length, staggerMs])

  const active = slides[index]

  return (
    <article className="group relative aspect-[3/4] w-full md:aspect-[4/5]">
      <div className="absolute inset-[4.5%] overflow-hidden rounded-xl bg-[#0c0d0f]">
        <div className="absolute inset-0">
          {active ? (
            <AnimatePresence mode="sync">
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={active}
                  alt={`${destination.city} — Fashion Beyond Borders`}
                  fill
                  unoptimized={active.includes('cloudinary.com')}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#12141a] px-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Add images in Admin
                <br />
                <span className="text-[var(--champagne)]/80">Home destination cards</span>
              </p>
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/75 via-black/35 to-transparent"
          aria-hidden
        />

        <h3 className="absolute inset-x-0 bottom-0 z-[1] px-3 pb-4 text-center font-[family-name:var(--font-display)] text-lg tracking-wide text-[var(--cream)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] transition-colors duration-300 group-hover:text-[var(--champagne)] md:px-4 md:pb-5 md:text-xl lg:text-2xl">
          {destination.city}
        </h3>
      </div>

      <OrnateGoldFrame uid={uid} />
    </article>
  )
}

'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getMediaUrl } from '@/lib/api'
import type { GalleryImage } from '@/lib/types'

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      if (e.key === 'ArrowRight') setActive((i) => (i === null ? i : (i + 1) % images.length))
      if (e.key === 'ArrowLeft')
        setActive((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, images.length])

  return (
    <>
      {/* Masonry columns — natural aspect ratios, no forced crop */}
      <div className="columns-2 gap-2 sm:columns-3 sm:gap-3 md:columns-4 lg:columns-5 xl:columns-6">
        {images.map((item, index) => {
          const url = getMediaUrl(item.image)
          if (!url) return null

          return (
            <button
              key={item.id || index}
              type="button"
              onClick={() => setActive(index)}
              className="group mb-2 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-[var(--surface-raised)] sm:mb-3"
            >
              <Image
                src={url}
                alt={item.caption || 'Gallery photo'}
                width={1200}
                height={1600}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="h-auto w-full object-contain transition duration-500 group-hover:brightness-110"
              />
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {active !== null ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Close"
              onClick={() => setActive(null)}
            >
              <X size={22} />
            </button>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 z-[1] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 md:left-6"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActive((i) => (i === null ? i : (i - 1 + images.length) % images.length))
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 z-[1] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 md:right-6"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActive((i) => (i === null ? i : (i + 1) % images.length))
                  }}
                >
                  <ChevronRight size={22} />
                </button>
              </>
            ) : null}

            <motion.div
              key={active}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative flex max-h-[85vh] max-w-5xl flex-col items-center"
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const url = getMediaUrl(images[active]?.image)
                if (!url) return null
                return (
                  <Image
                    src={url}
                    alt={images[active]?.caption || 'Gallery photo'}
                    width={1600}
                    height={1200}
                    className="max-h-[80vh] w-auto rounded-lg object-contain"
                  />
                )
              })()}
              <p className="mt-4 text-center text-xs uppercase tracking-[0.16em] text-white/55">
                {active + 1} / {images.length}
                {images[active]?.caption ? ` · ${images[active]?.caption}` : ''}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

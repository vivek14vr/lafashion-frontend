'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { getMediaUrl } from '@/lib/api'
import type { GalleryImage } from '@/lib/types'

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null)

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((item, index) => {
          const url = getMediaUrl(item.image)
          if (!url) return null

          return (
            <button
              key={item.id || index}
              type="button"
              onClick={() => setActive(index)}
              className="mb-4 block w-full overflow-hidden break-inside-avoid"
            >
              <motion.div whileHover={{ scale: 1.01 }} className="relative overflow-hidden">
                <Image
                  src={url}
                  alt={item.caption || 'Gallery photo'}
                  width={900}
                  height={1200}
                  className="h-auto w-full object-cover"
                />
              </motion.div>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {active !== null ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <button
              type="button"
              className="absolute right-6 top-6 text-white"
              aria-label="Close"
              onClick={() => setActive(null)}
            >
              <X size={28} />
            </button>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative max-h-[85vh] max-w-5xl"
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
                    className="max-h-[85vh] w-auto object-contain"
                  />
                )
              })()}
              {images[active]?.caption ? (
                <p className="mt-4 text-center text-sm text-white/70">{images[active]?.caption}</p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

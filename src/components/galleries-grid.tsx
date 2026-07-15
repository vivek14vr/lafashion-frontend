'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getGalleries, getMediaUrl } from '@/lib/api'
import { normalizeGalleryImages } from '@/lib/gallery'

export function GalleriesGrid() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['galleries'],
    queryFn: getGalleries,
  })

  if (isLoading) {
    return <p className="py-16 text-[var(--muted)]">Loading galleries…</p>
  }

  if (isError) {
    return (
      <p className="py-16 text-[var(--muted)]">
        Could not load galleries. Make sure the backend is running on port 3001.
      </p>
    )
  }

  if (!data?.docs.length) {
    return (
      <p className="py-16 text-[var(--muted)]">
        No galleries yet. Create one in the admin panel.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.docs.map((gallery, index) => {
        const first = normalizeGalleryImages(gallery.images)[0]
        const imageUrl = getMediaUrl(gallery.coverImage) || getMediaUrl(first?.image)

        return (
          <motion.div
            key={gallery.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.06 }}
          >
            <Link href={`/galleries/${gallery.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#17181c]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={gallery.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.05]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
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
  )
}

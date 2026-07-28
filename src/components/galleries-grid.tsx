'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { getGalleries, getMediaUrl } from '@/lib/api'
import { normalizeGalleryImages } from '@/lib/gallery'
import { OrnateGoldFrame } from '@/components/ornate-gold-frame'
import type { GalleryItem } from '@/lib/types'

const PAGE_SIZE = 9

function GalleryCard({ gallery, index }: { gallery: GalleryItem; index: number }) {
  const uid = useId().replace(/:/g, '')
  const first = normalizeGalleryImages(gallery.images)[0]
  const imageUrl = getMediaUrl(gallery.coverImage) || getMediaUrl(first?.image)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/galleries/${gallery.slug}`} className="group relative block">
        <div className="relative aspect-[3/4] w-full">
          <div className="absolute inset-[4.5%] overflow-hidden rounded-xl bg-[var(--surface-raised)]">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-center md:p-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)] transition group-hover:text-[var(--champagne)] md:text-3xl">
                {gallery.title}
              </h2>
              {gallery.location ? (
                <p className="mt-1 text-xs text-[var(--cream)]/65">{gallery.location}</p>
              ) : null}
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

export function GalleriesGrid() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim()
      setSearch((prev) => {
        if (prev !== next) setPage(1)
        return next
      })
    }, 320)
    return () => window.clearTimeout(id)
  }, [searchInput])

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['galleries', page, PAGE_SIZE, search],
    queryFn: () => getGalleries({ page, limit: PAGE_SIZE, search }),
    placeholderData: (prev) => prev,
  })

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const totalPages = data?.totalPages ?? 1
  const totalDocs = data?.totalDocs ?? 0
  const hasPrev = data?.hasPrevPage ?? page > 1
  const hasNext = data?.hasNextPage ?? page < totalPages

  return (
    <div>
      <label className="relative mb-8 flex max-w-md items-center">
        <span className="sr-only">Search galleries</span>
        <Search
          size={16}
          className="pointer-events-none absolute left-4 text-[var(--champagne)]/80"
          aria-hidden
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search title, location…"
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] py-3.5 pr-10 pl-11 text-sm text-[var(--cream)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--champagne)]/50"
        />
        {searchInput ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 rounded-full p-1 text-[var(--muted)] transition hover:text-[var(--cream)]"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </label>

      {isLoading && !data ? (
        <p className="py-16 text-[var(--muted)]">Loading galleries…</p>
      ) : isError ? (
        <p className="py-16 text-[var(--muted)]">
          Could not load galleries. Make sure the backend is running on port 3001.
        </p>
      ) : !data?.docs.length ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="text-[var(--muted)]">
            {search
              ? `No galleries match “${search}”.`
              : 'No galleries yet. Create one in the admin panel.'}
          </p>
          {search ? (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-4 text-sm uppercase tracking-[0.16em] text-[var(--champagne)] transition hover:text-[var(--cream)]"
            >
              Clear search
            </button>
          ) : null}
        </div>
      ) : (
        <div className={isFetching ? 'opacity-70 transition' : 'transition'}>
          {search ? (
            <p className="mb-5 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Showing results for “{search}”
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {data.docs.map((gallery, index) => (
              <GalleryCard key={gallery.id} gallery={gallery} index={index} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-10 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-5 sm:flex-row sm:px-6"
              aria-label="Galleries pagination"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Page {data.page} of {totalPages}
                <span className="mx-2 text-white/20">·</span>
                {totalDocs} {totalDocs === 1 ? 'gallery' : 'galleries'}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!hasPrev || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--cream)] transition hover:border-[var(--champagne)] hover:text-[var(--champagne)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => {
                      if (totalPages <= 5) return true
                      if (n === 1 || n === totalPages) return true
                      return Math.abs(n - page) <= 1
                    })
                    .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                      acc.push(n)
                      return acc
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="px-1 text-[var(--muted)]">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          disabled={isFetching}
                          onClick={() => setPage(item)}
                          className={`min-w-9 rounded-full px-3 py-2 text-xs transition ${
                            item === page
                              ? 'bg-[var(--champagne)] font-semibold text-[#14120f]'
                              : 'text-[var(--cream)]/70 hover:bg-[var(--surface-raised)] hover:text-[var(--champagne)]'
                          }`}
                          aria-current={item === page ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      ),
                    )}
                </div>

                <button
                  type="button"
                  disabled={!hasNext || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--cream)] transition hover:border-[var(--champagne)] hover:text-[var(--champagne)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </nav>
          ) : totalDocs > 0 ? (
            <p className="mt-8 text-center text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              {totalDocs} {totalDocs === 1 ? 'gallery' : 'galleries'}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

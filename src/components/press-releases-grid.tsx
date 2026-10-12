'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { getPressMediaUrl, getPressReleases } from '@/lib/api'
import type { PayloadListResponse, PressReleaseItem } from '@/lib/types'

function PressCard({ release }: { release: PressReleaseItem }) {
  const image = getPressMediaUrl(release.portraitImage)
  return <Link href={`/press-releases/${release.slug}`} className="group grid overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] transition hover:-translate-y-1 hover:border-[var(--champagne)]/50">
    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-raised)]">
      {image ? <Image src={image} alt={`${release.designerName} portrait`} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <span className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.2em] text-[var(--champagne)]">{release.featured ? 'Featured profile' : 'Designer profile'}</span>
    </div>
    <div className="p-5 md:p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{release.brandName || 'LA Fashion Closet press'}</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] group-hover:text-[var(--champagne)]">{release.title || release.designerName}</h2>
      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{release.designerName}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{release.excerpt}</p>
      <span className="mt-5 inline-block text-[10px] uppercase tracking-[0.2em] text-[var(--champagne)]">Read profile →</span>
    </div>
  </Link>
}

export function PressReleasesGrid({ initialPage }: { initialPage?: PayloadListResponse<PressReleaseItem> | null }) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => { const timer = window.setTimeout(() => setSearch(searchInput.trim()), 320); return () => window.clearTimeout(timer) }, [searchInput])
  const { data, isLoading, isError, isFetchNextPageError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['press-releases', search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getPressReleases({ page: pageParam, search }),
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialData: !search && initialPage ? { pages: [initialPage], pageParams: [1] } : undefined,
  })
  const releases = data?.pages.flatMap((page) => page.docs) || []
  return <div>
    <label className="relative mb-8 flex max-w-md items-center">
      <span className="sr-only">Search press releases</span><Search size={16} className="pointer-events-none absolute left-4 text-[var(--champagne)]/80" aria-hidden />
      <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search designers or brands…" className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] py-3.5 pr-10 pl-11 text-sm text-[var(--cream)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--champagne)]/50 focus-visible:ring-2 focus-visible:ring-[var(--champagne)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]" />
      {searchInput ? <button type="button" onClick={() => { setSearchInput(''); setSearch('') }} className="absolute right-2 flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-[var(--muted)] hover:text-[var(--cream)]" aria-label="Clear search"><X size={14} /></button> : null}
    </label>
    {isLoading ? <p className="py-16 text-[var(--muted)]" role="status">Loading designer profiles…</p> : isError && !releases.length ? <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-14 text-center" role="alert"><p className="text-[var(--muted)]">Press releases could not be loaded right now.</p><button type="button" onClick={() => void refetch()} className="mt-5 min-h-11 rounded-full border border-[var(--champagne)]/50 px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[var(--champagne)]">Try again</button></div> : !releases.length ? <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-16 text-center text-[var(--muted)]">{search ? `No profiles match “${search}”.` : 'Designer profiles will appear here as they are published.'}</div> : <><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{releases.map((release) => <PressCard key={release.id} release={release} />)}</div>{hasNextPage ? <div className="mt-10"><div className="flex justify-center"><button type="button" className="min-h-11 rounded-full border border-[var(--champagne)]/50 px-6 py-3 text-xs uppercase tracking-[0.16em] text-[var(--champagne)] disabled:opacity-60" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>{isFetchingNextPage ? 'Loading profiles…' : isFetchNextPageError ? 'Try again' : 'Load more profiles'}</button></div>{isFetchNextPageError ? <p className="mt-3 text-center text-sm text-[#ff9c91]" role="alert">More press releases could not be loaded. Try again.</p> : null}</div> : null}</>}
  </div>
}

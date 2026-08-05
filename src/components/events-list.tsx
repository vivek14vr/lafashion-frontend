'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { getPastEvents, getUpcomingEvents } from '@/lib/api'
import { EventCard } from './event-card'

const PAGE_SIZE = 6

type Tab = 'upcoming' | 'past'

export function EventsList() {
  const [tab, setTab] = useState<Tab>('upcoming')
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

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['events', tab, page, PAGE_SIZE, search],
    queryFn: () =>
      tab === 'upcoming'
        ? getUpcomingEvents({ page, limit: PAGE_SIZE, search })
        : getPastEvents({ page, limit: PAGE_SIZE, search }),
    placeholderData: (prev) => prev,
  })

  const switchTab = (next: Tab) => {
    setTab(next)
    setPage(1)
  }

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
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-2">
          {(
            [
              { id: 'upcoming' as const, label: 'Upcoming' },
              { id: 'past' as const, label: 'Past' },
            ] as const
          ).map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchTab(item.id)}
                className={`relative px-4 py-3.5 text-xs uppercase tracking-[0.2em] transition ${
                  active
                    ? 'bg-[var(--surface-raised)] text-[var(--champagne)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--cream)]'
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 bottom-0 h-px bg-[var(--champagne)]" />
                ) : null}
              </button>
            )
          })}
        </div>

        <label className="relative flex min-w-0 flex-1 items-center sm:max-w-sm">
          <span className="sr-only">Search events</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-4 text-[var(--champagne)]/80"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, venue…"
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
      </div>

      {isLoading && !data ? (
        <p className="py-16 text-[var(--muted)]">Loading events…</p>
      ) : isError ? (
        <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-14 text-center">
          <p className="text-[var(--muted)]">Events could not be loaded right now.</p>
          <button type="button" onClick={() => void refetch()} className="mt-5 rounded-full border border-[var(--champagne)]/50 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--champagne)] transition hover:bg-[var(--champagne)] hover:text-[#14120f]">Try again</button>
        </div>
      ) : !data?.docs.length ? (
        <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="text-[var(--muted)]">
            {search
              ? `No ${tab} events match “${search}”.`
              : tab === 'upcoming'
                ? 'No upcoming events yet. Add one in the admin panel.'
                : 'No past events published yet.'}
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
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Showing results for “{search}”
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-5 md:gap-6">
            {data.docs.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-10 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-5 sm:flex-row sm:px-6"
              aria-label="Events pagination"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Page {data.page} of {totalPages}
                <span className="mx-2 text-white/20">·</span>
                {totalDocs} {totalDocs === 1 ? 'event' : 'events'}
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
              {totalDocs} {totalDocs === 1 ? 'event' : 'events'}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

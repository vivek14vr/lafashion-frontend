import type { EventItem, GalleryItem, Media, PayloadListResponse } from './types'

// Same-origin by default (frontend proxies /api to Payload)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function getApiUrl() {
  return API_URL
}

export function getMediaUrl(media?: Media | string | null): string | null {
  if (!media) return null
  if (typeof media === 'string') return null
  if (!media.url) return null

  const raw = media.url

  // Absolute URLs: keep Cloudinary (and other CDN) as-is for next/image.
  // Rewrite same-origin Payload file URLs to relative /api/media/... paths.
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw)
      if (parsed.hostname.includes('cloudinary.com')) {
        return raw
      }
      if (parsed.pathname.startsWith('/api/media')) {
        return `${parsed.pathname}${parsed.search}`
      }
    } catch {
      return raw
    }
    return raw
  }

  return raw.startsWith('/') ? raw : `/${raw}`
}

async function fetchPayload<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    next: init?.cache === 'no-store' ? undefined : { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`)
  }

  return response.json() as Promise<T>
}

type EventListOptions = {
  page?: number
  limit?: number
  search?: string
}

function appendEventSearch(query: URLSearchParams, search: string | undefined, andIndexStart: number) {
  const term = search?.trim()
  if (!term) return

  // Nested under and[N]: (title OR venue OR excerpt) contains term
  const i = andIndexStart
  query.set(`where[and][${i}][or][0][title][contains]`, term)
  query.set(`where[and][${i}][or][1][venue][contains]`, term)
  query.set(`where[and][${i}][or][2][excerpt][contains]`, term)
}

export async function getUpcomingEvents(options?: EventListOptions) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const now = new Date().toISOString()
  // Filter by date (not stored status) so past dates never appear as upcoming
  const query = new URLSearchParams({
    'where[and][0][date][greater_than_equal]': now,
    'where[and][1][published][equals]': 'true',
    sort: 'date',
    depth: '1',
    limit: String(limit),
    page: String(page),
  })
  appendEventSearch(query, options?.search, 2)

  return fetchPayload<PayloadListResponse<EventItem>>(`/api/events?${query}`)
}

export async function getPastEvents(options?: EventListOptions) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const now = new Date().toISOString()
  const query = new URLSearchParams({
    'where[and][0][date][less_than]': now,
    'where[and][1][published][equals]': 'true',
    sort: '-date',
    depth: '1',
    limit: String(limit),
    page: String(page),
  })
  appendEventSearch(query, options?.search, 2)

  return fetchPayload<PayloadListResponse<EventItem>>(`/api/events?${query}`)
}

export async function getEventBySlug(slug: string) {
  const query = new URLSearchParams({
    'where[and][0][slug][equals]': slug,
    'where[and][1][published][equals]': 'true',
    depth: '2',
    limit: '1',
  })

  const data = await fetchPayload<PayloadListResponse<EventItem>>(`/api/events?${query}`)
  return data.docs[0] ?? null
}

export async function getGalleryForEvent(eventId: string) {
  const query = new URLSearchParams({
    'where[and][0][event][equals]': eventId,
    'where[and][1][published][equals]': 'true',
    depth: '0',
    limit: '1',
  })

  const data = await fetchPayload<PayloadListResponse<GalleryItem>>(`/api/galleries?${query}`)
  return data.docs[0] ?? null
}

export async function getGalleries(options?: { page?: number; limit?: number; search?: string }) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 12
  const query = new URLSearchParams({
    'where[and][0][published][equals]': 'true',
    sort: '-createdAt',
    depth: '1',
    limit: String(limit),
    page: String(page),
  })

  const term = options?.search?.trim()
  if (term) {
    query.set('where[and][1][or][0][title][contains]', term)
    query.set('where[and][1][or][1][location][contains]', term)
    query.set('where[and][1][or][2][excerpt][contains]', term)
  }

  return fetchPayload<PayloadListResponse<GalleryItem>>(`/api/galleries?${query}`)
}

/** Prefer live date over stored status (status can lag until a document is re-saved). */
export function isEventPast(event: Pick<EventItem, 'date' | 'status'>) {
  const t = new Date(event.date).getTime()
  if (!Number.isNaN(t)) return t < Date.now()
  return event.status === 'past'
}

export async function getGalleryBySlug(slug: string) {
  const query = new URLSearchParams({
    'where[and][0][slug][equals]': slug,
    'where[and][1][published][equals]': 'true',
    depth: '2',
    limit: '1',
  })

  const data = await fetchPayload<PayloadListResponse<GalleryItem>>(`/api/galleries?${query}`)
  return data.docs[0] ?? null
}

export function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

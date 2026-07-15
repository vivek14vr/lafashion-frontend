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

export async function getUpcomingEvents() {
  const query = new URLSearchParams({
    'where[and][0][status][equals]': 'upcoming',
    'where[and][1][published][equals]': 'true',
    sort: 'date',
    depth: '1',
    limit: '20',
  })

  return fetchPayload<PayloadListResponse<EventItem>>(`/api/events?${query}`)
}

export async function getPastEvents() {
  const query = new URLSearchParams({
    'where[and][0][status][equals]': 'past',
    'where[and][1][published][equals]': 'true',
    sort: '-date',
    depth: '1',
    limit: '20',
  })

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

export async function getGalleries() {
  const query = new URLSearchParams({
    'where[published][equals]': 'true',
    sort: '-createdAt',
    depth: '1',
    limit: '50',
  })

  return fetchPayload<PayloadListResponse<GalleryItem>>(`/api/galleries?${query}`)
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

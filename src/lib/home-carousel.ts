import { getMediaUrl } from './api'
import type { Media } from './types'

export type DestinationTour = {
  id: string
  city: string
  /** @deprecated unused on cards — kept for type compat */
  date?: string
  venue?: string
  flag?: string
  folder?: string
}

export type DestinationWithImages = DestinationTour & { images: string[] }

type HomeDestinationDoc = {
  id?: string
  city: string
  images?: (Media | string)[] | null
}

type HomeDestinationsGlobal = {
  destinations?: HomeDestinationDoc[] | null
}

/** Fallback cities if admin global is empty / API down */
export const DESTINATIONS: DestinationTour[] = [
  { id: 'new-delhi', city: 'New Delhi', folder: 'new-delhi' },
  { id: 'los-angeles', city: 'Los Angeles', folder: 'los-angeles' },
  { id: 'mauritius', city: 'Mauritius', folder: 'mauritius' },
  { id: 'paris', city: 'Paris', folder: 'paris' },
  { id: 'cannes', city: 'Cannes', folder: 'cannes' },
]

function slugifyCity(city: string, index: number): string {
  const slug = city
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || `destination-${index}`
}

function mediaToUrls(images?: (Media | string)[] | null): string[] {
  if (!images?.length) return []
  return images
    .map((item) => {
      if (!item || typeof item === 'string') return null
      return getMediaUrl(item)
    })
    .filter((url): url is string => Boolean(url))
}

/** Load homepage destination cards from Payload (Admin → Home destination cards). */
export async function getDestinationCarousels(): Promise<DestinationWithImages[]> {
  try {
    // Prefer hitting the CMS directly on the server so localhost API URLs
    // don't break production SSR when NEXT_PUBLIC_API_URL points at the site.
    const base =
      typeof window === 'undefined' && process.env.PAYLOAD_BACKEND_URL
        ? process.env.PAYLOAD_BACKEND_URL.replace(/\/$/, '')
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '')

    // Hard timeout — Render static generation fails after 60s if the CMS is
    // asleep/unreachable and fetch hangs with no AbortSignal.
    const response = await fetch(`${base}/api/globals/home-destinations?depth=2`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    })

    if (response.ok) {
      const data = (await response.json()) as HomeDestinationsGlobal
      const rows = data.destinations?.filter((row) => row?.city?.trim()) ?? []

      if (rows.length > 0) {
        return rows.map((row, index) => ({
          id: row.id || slugifyCity(row.city, index),
          city: row.city.trim(),
          images: mediaToUrls(row.images),
        }))
      }
    }
  } catch {
    // Fall through to defaults (timeout, network error, cold CMS, etc.)
  }

  return DESTINATIONS.map((destination) => ({
    ...destination,
    images: [],
  }))
}

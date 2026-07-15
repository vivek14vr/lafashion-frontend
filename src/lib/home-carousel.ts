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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Load homepage destination cards from Payload (Admin → Home destination cards). */
export async function getDestinationCarousels(): Promise<DestinationWithImages[]> {
  try {
    const response = await fetch(`${API_URL}/api/globals/home-destinations?depth=2`, {
      next: { revalidate: 30 },
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
    // Fall through to defaults
  }

  return DESTINATIONS.map((destination) => ({
    ...destination,
    images: [],
  }))
}

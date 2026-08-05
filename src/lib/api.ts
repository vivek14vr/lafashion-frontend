import type { EventItem, GalleryItem, Media, PayloadListResponse } from './types'

// Browser requests must stay on the current origin so they use the production
// /api proxy. Server components can talk to Payload directly without making a
// request back through the public frontend.
const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const SERVER_API_URL = (process.env.PAYLOAD_BACKEND_URL || 'http://127.0.0.1:3001').replace(
  /\/$/,
  '',
)

function getRequestApiUrl() {
  return typeof window === 'undefined' ? SERVER_API_URL : PUBLIC_API_URL
}

export function getApiUrl() {
  return PUBLIC_API_URL
}

export function getMediaUrl(media?: Media | string | null): string | null {
  if (!media) return null
  if (typeof media === 'string') return null
  if (!media.url) return null

  const raw = media.url

  // Absolute URLs: keep legacy Cloudinary and other CDN URLs as-is.
  // Rewrite same-origin Payload file URLs to relative /api/media/... paths.
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw)
      if (parsed.hostname.includes('cloudinary.com')) {
        // Payload's S3 adapter can append its object prefix as a query
        // parameter when reading legacy records. That parameter is not part
        // of the Cloudinary asset URL and should not be sent to the CDN.
        parsed.searchParams.delete('prefix')
        return parsed.toString()
      }
      // Private S3 files must be fetched through Payload so its storage
      // adapter can issue a short-lived signed download URL.
      if (parsed.hostname.includes('amazonaws.com') && media.filename) {
        const prefix = media.prefix ? `?prefix=${encodeURIComponent(media.prefix)}` : ''
        return `${PUBLIC_API_URL}/api/media/file/${encodeURIComponent(media.filename)}${prefix}`
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
  const response = await fetch(`${getRequestApiUrl()}${path}`, {
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
    'where[and][1][_status][equals]': 'published',
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
    'where[and][1][_status][equals]': 'published',
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
    'where[and][1][_status][equals]': 'published',
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

export type RegistrationPayload = {
  title?: string
  firstName: string
  lastName: string
  phone: string
  email: string
  instagramUrl: string
  gender: string
  genderOther?: string
  city: string
  state: string
  height: string
  weight: string
  bustChest: string
  waist: string
  hips: string
  dressSize: string
  suitSize: string
  shoeSize: string
  runwayExperience: string
  locations: string[]
  publishedModel: string
  publishedWhere?: string
  agencyStatus: string
  isMinor: string
  consentUnpaid: boolean
  consentExpenses: boolean
  consentCredit: boolean
  consentLikeness: boolean
  consentRelease: boolean
  signatureName: string
  signatureDate: string
}

export type CommunityRegistrationPayload = {
  role: string
  roleOther?: string
  title?: string
  firstName: string
  lastName: string
  phone: string
  email: string
  instagramUrl: string
  gender: string
  genderOther?: string
  city: string
  state: string
  locations: string[]
  isMinor: string
  consentUnpaid: boolean
  consentCredit: boolean
  consentLikeness: boolean
  consentMedia: boolean
  signatureName: string
  signatureDate: string
}

export type DesignerRegistrationPayload = {
  title?: string
  firstName: string
  lastName: string
  phone: string
  email: string
  looks: string
  looksOther?: string
  instagramUrl: string
  retailCategory: string
  retailCategoryOther?: string
  city: string
  state: string
  runwayExperience: string
  locations: string[]
  isMinor: string
  consentCredit: boolean
  consentLikeness: boolean
  signatureName: string
  signatureDate: string
}

type RegistrationErrorBody = {
  message?: string
  errors?: Array<{
    message?: string
    data?: { errors?: Array<{ message?: string; label?: string }> }
  }>
} | null

async function submitRegistrationCollection(path: string, data: unknown) {
  const response = await fetch(`${getRequestApiUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => null)) as RegistrationErrorBody

  if (!response.ok) {
    const top = body?.errors?.[0]
    const fieldErrors = top?.data?.errors
      ?.map((e) => e.message)
      .filter(Boolean)
      .slice(0, 3)
    const detail =
      (fieldErrors && fieldErrors.length > 0 ? fieldErrors.join(' ') : null) ||
      top?.message ||
      body?.message ||
      `Could not submit registration (${response.status})`
    throw new Error(detail)
  }

  return body
}

export async function submitRegistration(data: RegistrationPayload) {
  return submitRegistrationCollection('/api/registrations', data)
}

export async function submitCommunityRegistration(data: CommunityRegistrationPayload) {
  return submitRegistrationCollection('/api/community-registrations', data)
}

export async function submitDesignerRegistration(data: DesignerRegistrationPayload) {
  return submitRegistrationCollection('/api/designer-registrations', data)
}

import type { EventItem, GalleryItem, Media, PayloadListResponse, PressReleaseItem } from './types'

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

/** Press assets must come from Payload's private file route (or the configured S3 origin). */
export function getPressMediaUrl(media?: Media | string | null): string | null {
  if (!media || typeof media === 'string' || !media.url) return null

  try {
    const rawURL = media.url.trim()
    const parsed = new URL(rawURL, 'http://payload.local')
    const isRelativePayloadFile = rawURL.startsWith('/api/media/file/')
    // Payload can serialize its private file URL with the backend hostname,
    // the public frontend hostname, or an EC2 hostname. The host is discarded
    // below; only the protected Payload path is proxied through this origin.
    const isPayloadFile = isRelativePayloadFile || parsed.pathname.startsWith('/api/media/file/')
    const isS3Object = parsed.hostname.endsWith('.amazonaws.com')
    if (!isPayloadFile && !isS3Object) return null

    // Keep private Press assets same-origin so Next's image optimizer uses the
    // frontend /api proxy and Payload can issue a short-lived S3 download URL.
    if (isS3Object && media.filename) {
      const prefix = media.prefix ? `?prefix=${encodeURIComponent(media.prefix)}` : ''
      return `/api/media/file/${encodeURIComponent(media.filename)}${prefix}`
    }
    if (isPayloadFile) return `${parsed.pathname}${parsed.search}`
  } catch {
    return null
  }

  return null
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
  const now = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  // Filter by the derived six-hour end time so an event remains upcoming until it ends.
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
  const now = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
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
export function isEventPast(event: Pick<EventItem, 'date' | 'endDate' | 'status'>) {
  const t = new Date(event.endDate || new Date(new Date(event.date).getTime() + 6 * 60 * 60 * 1000)).getTime()
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

export async function getPressReleases(options?: { page?: number; limit?: number; search?: string }) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 12
  const now = new Date()
  now.setSeconds(0, 0)
  const query = new URLSearchParams({
    'where[and][0][published][equals]': 'true',
    'where[and][1][publishDate][less_than_equal]': now.toISOString(),
    sort: '-featured,-publishDate,-createdAt',
    depth: '1',
    limit: String(limit),
    page: String(page),
    'select[title]': 'true',
    'select[slug]': 'true',
    'select[designerName]': 'true',
    'select[brandName]': 'true',
    'select[excerpt]': 'true',
    'select[portraitImage]': 'true',
    'select[publishDate]': 'true',
    'select[featured]': 'true',
  })
  const term = options?.search?.trim()
  if (term) {
    query.set('where[and][2][or][0][title][contains]', term)
    query.set('where[and][2][or][1][designerName][contains]', term)
    query.set('where[and][2][or][2][brandName][contains]', term)
  }
  return fetchPayload<PayloadListResponse<PressReleaseItem>>(`/api/press-releases?${query}`, {
    headers: { 'x-site-public-read': 'true' },
  })
}

export async function getPressReleaseBySlug(slug: string) {
  const now = new Date()
  now.setSeconds(0, 0)
  const query = new URLSearchParams({
    'where[and][0][slug][equals]': slug,
    'where[and][1][published][equals]': 'true',
    'where[and][2][publishDate][less_than_equal]': now.toISOString(),
    depth: '2',
    limit: '1',
  })
  const data = await fetchPayload<PayloadListResponse<PressReleaseItem>>(`/api/press-releases?${query}`, {
    headers: { 'x-site-public-read': 'true' },
  })
  return data.docs[0] ?? null
}

export function formatEventDate(date: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(date))
  return formatter
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

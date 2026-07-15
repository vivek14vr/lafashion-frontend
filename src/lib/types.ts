export type Media = {
  id: string
  alt?: string | null
  url?: string | null
  filename?: string | null
  width?: number | null
  height?: number | null
}

export type LexicalNode = {
  type?: string
  text?: string
  format?: number | string
  tag?: string
  url?: string
  listType?: string
  children?: LexicalNode[]
}

export type LexicalContent = {
  root?: {
    children?: LexicalNode[]
  }
} | null

export type EventItem = {
  id: string
  title: string
  slug: string
  date: string
  venue: string
  excerpt: string
  description?: LexicalContent
  ticketUrl?: string | null
  status: 'upcoming' | 'past'
  published?: boolean
  portraitImage?: Media | string | null
  bannerImage?: Media | string | null
}

export type GalleryImage = {
  id?: string
  image: Media | string
  caption?: string | null
}

export type GalleryItem = {
  id: string
  title: string
  slug: string
  published?: boolean
  source?: 'standalone' | 'platform' | null
  date?: string | null
  location?: string | null
  excerpt?: string | null
  coverImage?: Media | string | null
  event?: EventItem | string | null
  /** hasMany Media docs, IDs, or legacy { image, caption } rows */
  images?: (Media | string | GalleryImage)[] | null
}

export type PayloadListResponse<T> = {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

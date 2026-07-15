import type { GalleryImage, Media } from './types'

function isMedia(item: object): item is Media {
  return 'id' in item && typeof (item as Media).id === 'string' && !('image' in item)
}

/** Normalize gallery image rows from the CMS (hasMany Media or legacy { image, caption }). */
export function normalizeGalleryImages(
  images?: (Media | string | GalleryImage)[] | null,
): GalleryImage[] {
  if (!images?.length) return []

  const rows: GalleryImage[] = []

  images.forEach((item, index) => {
    if (!item) return
    if (typeof item === 'string') {
      rows.push({ id: item, image: item, caption: null })
      return
    }
    if ('image' in item && item.image) {
      rows.push({
        id: item.id || String(index),
        image: item.image,
        caption: item.caption ?? null,
      })
      return
    }
    if (isMedia(item)) {
      rows.push({
        id: item.id,
        image: item,
        caption: item.alt ?? null,
      })
    }
  })

  return rows
}

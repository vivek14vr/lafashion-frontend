import { ExperimentHome } from '@/components/experiment-home'
import { getDestinationCarousels } from '@/lib/home-carousel'

export default async function Page() {
  const destinations = await getDestinationCarousels()
  return (
    <>
      {/* Preload LCP hero art — skip /_next/image so Render serves static WebP immediately */}
      <link
        rel="preload"
        as="image"
        type="image/webp"
        href="/banner_lady.webp"
        imageSrcSet="/banner_lady-800.webp 800w, /banner_lady-1200.webp 1200w, /banner_lady.webp 1536w"
        imageSizes="100vw"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        type="image/webp"
        href="/world-map-dots.webp"
        imageSrcSet="/world-map-dots-1000.webp 1000w, /world-map-dots.webp 2000w"
        imageSizes="100vw"
        fetchPriority="low"
      />
      <ExperimentHome destinations={destinations} />
    </>
  )
}

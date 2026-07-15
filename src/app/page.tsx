import { getDestinationCarousels } from '@/lib/home-carousel'
import { HomePage } from '@/components/home-page'

export default async function Page() {
  const destinations = await getDestinationCarousels()
  return <HomePage destinations={destinations} />
}

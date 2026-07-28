import { ExperimentHome } from '@/components/experiment-home'
import { getDestinationCarousels } from '@/lib/home-carousel'

export default async function Page() {
  const destinations = await getDestinationCarousels()
  return <ExperimentHome destinations={destinations} />
}

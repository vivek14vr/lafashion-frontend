import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Experiment',
  robots: { index: false, follow: false },
}

/** Experiment landing is now the home page. */
export default function ExperimentPage() {
  redirect('/')
}

import type { Metadata } from 'next'
import { EventsList } from '@/components/events-list'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming LA Fashion Closet events and ticket booking links.',
}

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-28">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Calendar</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--cream)] md:text-6xl">
          Upcoming events
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          Tickets are sold through our partner platforms. Choose a night and continue to booking.
        </p>
      </div>
      <EventsList />
    </div>
  )
}

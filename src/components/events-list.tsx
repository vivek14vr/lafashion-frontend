'use client'

import { useQuery } from '@tanstack/react-query'
import { getUpcomingEvents } from '@/lib/api'
import { EventCard } from './event-card'

export function EventsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: getUpcomingEvents,
  })

  if (isLoading) {
    return <p className="py-16 text-[var(--muted)]">Loading events…</p>
  }

  if (isError) {
    return (
      <p className="py-16 text-[var(--muted)]">
        Could not load events. Make sure the backend is running on port 3001.
      </p>
    )
  }

  if (!data?.docs.length) {
    return (
      <p className="py-16 text-[var(--muted)]">
        No upcoming events yet. Add one in the admin panel.
      </p>
    )
  }

  return (
    <div>
      {data.docs.map((event, index) => (
        <EventCard key={event.id} event={event} index={index} />
      ))}
    </div>
  )
}

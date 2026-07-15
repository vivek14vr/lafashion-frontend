import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { formatEventDate, getEventBySlug, getMediaUrl } from '@/lib/api'
import { RichText } from '@/components/rich-text'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug).catch(() => null)
  if (!event) return { title: 'Event' }
  return {
    title: event.title,
    description: event.excerpt,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const event = await getEventBySlug(slug).catch(() => null)

  if (!event) notFound()

  const bannerUrl = getMediaUrl(event.bannerImage)
  const bannerAlt =
    typeof event.bannerImage === 'object' && event.bannerImage?.alt
      ? event.bannerImage.alt
      : event.title
  const portraitUrl = getMediaUrl(event.portraitImage)
  const portraitAlt =
    typeof event.portraitImage === 'object' && event.portraitImage?.alt
      ? event.portraitImage.alt
      : event.title

  return (
    <div>
      <section className="relative overflow-hidden bg-[#0c0d0f] pt-16 md:pt-20">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#17181c] md:aspect-[21/9]">
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt={bannerAlt}
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 1152px) 100vw, 1152px"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0f] via-[#0c0d0f]/40 to-transparent" />
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">
            {event.status === 'upcoming' ? 'Upcoming event' : 'Past event'}
          </p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-5xl leading-none text-[var(--cream)] md:text-7xl">
            {event.title}
          </h1>
          {event.ticketUrl && event.status === 'upcoming' ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--champagne)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
            >
              Book tickets
              <ArrowUpRight size={16} />
            </a>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="flex flex-col gap-3 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {formatEventDate(event.date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} />
              {event.venue}
            </span>
          </div>
          <p className="mt-8 text-lg leading-relaxed text-[var(--cream)]/85">{event.excerpt}</p>
          <RichText content={event.description} />
        </div>

        <aside className="h-fit overflow-hidden border border-white/10 bg-white/[0.03]">
          {portraitUrl ? (
            <div className="relative aspect-[3/4] w-full bg-[#17181c]">
              <Image
                src={portraitUrl}
                alt={portraitAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 32vw"
              />
            </div>
          ) : null}
          <div className="p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--champagne)]">Tickets</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Booking is handled on our partner site. You’ll leave LA Fashion Closet to complete checkout.
            </p>
            {event.ticketUrl ? (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--champagne)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
              >
                Book tickets
                <ArrowUpRight size={16} />
              </a>
            ) : (
              <p className="mt-6 text-sm text-[var(--muted)]">Tickets opening soon.</p>
            )}
            <Link
              href="/events"
              className="mt-4 inline-flex text-sm uppercase tracking-[0.14em] text-[var(--cream)]/70 hover:text-[var(--champagne)]"
            >
              All events
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}

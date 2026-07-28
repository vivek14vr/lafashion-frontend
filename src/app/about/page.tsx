import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description:
    'LA Fashion Closet by Shagun Gupta — global fashion productions, Fashion Beyond Borders, and a stage where women support women.',
}

const cities = ['Los Angeles', 'Las Vegas', 'New Delhi', 'Paris', 'Cannes', 'Milan', 'Mauritius']

const pillars = [
  {
    title: 'Global productions',
    body: 'Upscale runway nights and fashion weeks designed as spectacles — blending fashion, art, and entertainment for designers, models, and audiences worldwide.',
  },
  {
    title: 'Fashion Beyond Borders',
    body: 'A touring vision that moves culture across cities — connecting emerging talent with established houses on one shared stage.',
  },
  {
    title: 'Women supporting women',
    body: 'Networking, collaboration, and visibility for entrepreneurs and creatives — rooted in the belief that when women support women, amazing things happen.',
  },
]

export default function AboutPage() {
  return (
    <div className="bg-[var(--background)]">
      {/* Hero */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-28 md:pb-20">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">About</p>
          <h1 className="mt-3 max-w-4xl font-[family-name:var(--font-display)] text-5xl leading-[1.05] text-[var(--cream)] md:text-7xl">
            LA Fashion Closet
          </h1>
          <p className="mt-3 text-xl text-[var(--champagne)] md:text-2xl">by Shagun Gupta</p>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)] md:text-base">
            A global fashion production house — from a personal closet in Los Angeles to runways
            across continents — built to celebrate designers, empower women entrepreneurs, and stage
            nights that feel like art.
          </p>
        </div>
      </section>

      {/* Mantra */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(212,165,116,0.12), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--champagne)]">Our mantra</p>
          <div className="mx-auto mt-6 h-px w-14 bg-[var(--champagne)]/50" />
          <blockquote className="mt-8 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[1.15] text-[var(--cream)]">
            “When women support women, amazing things happen.”
          </blockquote>
        </div>
      </section>

      {/* Story */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">The house</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] md:text-5xl">
              From closet to global stage
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-relaxed text-[var(--cream)]/75 md:text-base">
            <p>
              LA Fashion Closet began as something deeply personal — Shagun Gupta selling Indian
              clothing and jewelry from her own closet in Los Angeles. What started as a boutique
              soon grew into a platform for connection, visibility, and celebration.
            </p>
            <p>
              Founded in 2018, the house evolved into one of the industry’s sought-after fashion
              production studios — hosting fashion weeks and runway productions that bring emerging
              designers together with established names, and audiences into nights built for drama,
              craft, and culture.
            </p>
            <p>
              Today, Fashion Beyond Borders carries that vision worldwide — Los Angeles, Las Vegas,
              Milan, Cannes, New Delhi, Mauritius, and more — proving fashion is a language that
              travels.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">What we build</p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] md:text-5xl">
          Production, platform, purpose
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-8"
            >
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)]">
                {pillar.title}
              </h3>
              <div className="mt-4 h-px w-10 bg-[var(--champagne)]/45" />
              <p className="mt-5 text-sm leading-relaxed text-[var(--muted)]">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Founder */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Founder & CEO</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] md:text-5xl">
            Shagun Gupta
          </h2>
          <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:gap-14">
            <div className="space-y-5 text-[15px] leading-relaxed text-[var(--cream)]/75 md:text-base">
              <p>
                Philanthropist, entrepreneur, and producer — Shagun is the visionary behind LA
                Fashion Closet. A graduate of New Delhi who earned her Master’s in Human Resource
                Management at UCLA, she left the corporate path to follow fashion, community, and
                empowerment.
              </p>
              <p>
                She designed and sold Indian jewelry and clothing from her home boutique, represented
                India as Mrs India in Mrs Asia USA, and built LA Fashion Closet as a leading space
                for networking, advancing, and celebrating women and girls — through runway nights,
                collaborations, and entertainment that puts talent forward.
              </p>
              <p>
                Her work merges Indian creative communities with the global mainstream — one event,
                one city, one connection at a time.
              </p>
            </div>
            <aside className="h-fit rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--champagne)]">
                Stages & cities
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {cities.map((city) => (
                  <li
                    key={city}
                    className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3.5 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--cream)]/80"
                  >
                    {city}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
                Fashion Beyond Borders continues to expand the map — new cities, new designers, same
                vision.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-12 text-center md:px-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Join the night</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] md:text-5xl">
            Experience the next production
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
            Explore upcoming dates, revisit past galleries, or reach the house directly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--champagne)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)]"
            >
              View events
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/galleries"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--champagne)]/50 px-6 py-3 text-sm uppercase tracking-[0.14em] text-[var(--champagne)] transition hover:border-[var(--champagne)] hover:bg-[var(--champagne)] hover:text-[#14120f]"
            >
              Our gallery
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mt-10 space-y-2 text-sm text-[var(--cream)]/65">
            <p>
              <a
                href="https://www.lafashioncloset.com"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[var(--champagne)]"
              >
                www.lafashioncloset.com
              </a>
            </p>
            <p>
              <a href="tel:+13102287705" className="transition hover:text-[var(--champagne)]">
                +1 310 228 7705
              </a>
            </p>
            <p>
              <a
                href="https://www.instagram.com/lafashioncloset"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[var(--champagne)]"
              >
                @lafashioncloset
              </a>
              {' · '}
              <a
                href="https://www.instagram.com/fashionbeyondborders"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[var(--champagne)]"
              >
                @fashionbeyondborders
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

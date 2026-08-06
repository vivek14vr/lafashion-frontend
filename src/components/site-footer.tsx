import Image from 'next/image'
import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-14 md:flex-row md:items-end md:justify-between md:py-16">
        <div>
          <div className="relative h-10 w-[200px]">
            <Image
              src="/logo.png"
              alt="LA Fashion Closet by Shagun"
              fill
              sizes="200px"
              unoptimized
              className="object-cover object-center"
            />
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Where fashion becomes an experience — runway nights, designer wear, and a global stage
            for timeless elegance.
          </p>
          <div className="mt-6 flex flex-col gap-1.5 text-sm text-[var(--cream)]/65">
            <a
              href="https://www.lafashioncloset.com"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[var(--champagne)]"
            >
              www.lafashioncloset.com
            </a>
            <a
              href="https://www.instagram.com/lafashioncloset"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[var(--champagne)]"
            >
              @lafashioncloset
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-8 md:items-end">
          <nav className="flex flex-wrap gap-6 text-sm uppercase tracking-[0.16em] text-[var(--cream)]/70">
            <Link href="/events" className="transition hover:text-[var(--champagne)]">
              Events
            </Link>
            <Link href="/galleries" className="transition hover:text-[var(--champagne)]">
              Galleries
            </Link>
            <Link href="/about" className="transition hover:text-[var(--champagne)]">
              About
            </Link>
          </nav>
          <p className="text-xs tracking-[0.08em] text-[var(--muted)]">
            © {new Date().getFullYear()} LA Fashion Closet by Shagun
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-4">
          <p className="text-xs tracking-[0.08em] text-[var(--muted)]">Designed and developed by</p>
          <a
            href="https://roamingevents.com"
            aria-label="Visit Roaming Events"
            className="relative block aspect-[3.67] w-[112px] overflow-hidden bg-white transition-opacity hover:opacity-80"
          >
            <Image
              src="/roaming-events.webp"
              alt="Roaming Events"
              fill
              sizes="112px"
              unoptimized
              className="object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  )
}

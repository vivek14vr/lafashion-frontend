import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-28">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">About</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--cream)] md:text-6xl">
        LA Fashion Closet
      </h1>
      <p className="mt-2 text-lg text-[var(--champagne)]">by Shagun</p>
      <p className="mt-6 text-lg leading-relaxed text-[var(--cream)]/80">
        At LA Fashion Closet, fashion is more than clothing — it is an expression of art, culture,
        and timeless elegance. Our productions blend luxury and creativity, built to transcend
        boundaries and bring the world closer through the universal language of fashion.
      </p>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        Through Fashion Beyond Borders and our runway nights across cities like New Delhi, Los
        Angeles, Paris, Cannes, and beyond, we create stages where designer wear meets a global
        audience.
      </p>
      <div className="mt-10 space-y-2 text-sm text-[var(--cream)]/70">
        <p>
          <a
            href="https://www.lafashioncloset.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--champagne)]"
          >
            www.lafashioncloset.com
          </a>
        </p>
        <p>
          <a href="tel:+13102287705" className="hover:text-[var(--champagne)]">
            +1 310 228 7705
          </a>
        </p>
        <p>
          Instagram{' '}
          <a
            href="https://www.instagram.com/lafashioncloset"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--champagne)]"
          >
            @lafashioncloset
          </a>
          {' · '}
          <a
            href="https://www.instagram.com/fashionbeyondborders"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--champagne)]"
          >
            @fashionbeyondborders
          </a>
        </p>
      </div>
    </div>
  )
}

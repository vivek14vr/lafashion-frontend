'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/events', label: 'Events' },
  { href: '/galleries', label: 'Galleries' },
  { href: '/register', label: 'Register' },
  { href: '/about', label: 'About' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open
          ? 'border-[var(--border-strong)] bg-[var(--surface)]/90 backdrop-blur-xl'
          : 'border-[var(--border-subtle)] bg-[var(--background)]/60 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="relative block h-9 w-[168px] sm:h-10 sm:w-[190px]">
          <Image
            src="/logo.webp"
            alt="LA Fashion Closet by Shagun"
            fill
            sizes="190px"
            priority
            unoptimized
            className="object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm uppercase tracking-[0.18em] transition-colors ${
                pathname.startsWith(link.href)
                  ? 'text-[var(--champagne)]'
                  : 'text-[var(--cream)]/75 hover:text-[var(--cream)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/events"
            className="rounded-full border border-[var(--champagne)]/40 px-4 py-2 text-sm uppercase tracking-[0.14em] text-[var(--champagne)] transition hover:border-[var(--champagne)] hover:bg-[var(--champagne)]/10"
          >
            Book tickets
          </Link>
        </nav>

        <button
          type="button"
          className="text-[var(--cream)] md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg text-[var(--cream)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}

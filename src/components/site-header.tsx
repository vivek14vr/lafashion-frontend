'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { registrationLinks } from '@/lib/registration-links'

const links = [
  { href: '/events', label: 'Events' },
  { href: '/galleries', label: 'Galleries' },
  { href: '/about', label: 'About' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [mobileRegisterOpen, setMobileRegisterOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const registerRef = useRef<HTMLDivElement>(null)

  const registerActive = pathname.startsWith('/register')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setRegisterOpen(false)
    setMobileRegisterOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!registerOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!registerRef.current?.contains(event.target as Node)) {
        setRegisterOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRegisterOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [registerOpen])

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
            src="/logo.png"
            alt="LA Fashion Closet by Shagun"
            fill
            sizes="190px"
            priority
            unoptimized
            className="object-cover object-center"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.slice(0, 2).map((link) => (
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

          <div
            ref={registerRef}
            className="relative"
            onMouseEnter={() => setRegisterOpen(true)}
            onMouseLeave={() => setRegisterOpen(false)}
          >
            <button
              type="button"
              aria-expanded={registerOpen}
              aria-haspopup="menu"
              onClick={() => setRegisterOpen((value) => !value)}
              className={`inline-flex items-center gap-1.5 text-sm uppercase tracking-[0.18em] transition-colors ${
                registerActive
                  ? 'text-[var(--champagne)]'
                  : 'text-[var(--cream)]/75 hover:text-[var(--cream)]'
              }`}
            >
              Register
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${registerOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <div
              role="menu"
              className={`absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 transition ${
                registerOpen
                  ? 'pointer-events-auto opacity-100'
                  : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="border border-[var(--border-strong)] bg-[var(--surface)]/95 py-2 shadow-xl backdrop-blur-xl">
                {registrationLinks.map((link) => {
                  const active = link.match(pathname)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={`block px-4 py-2.5 text-sm tracking-[0.04em] transition-colors ${
                        active
                          ? 'text-[var(--champagne)]'
                          : 'text-[var(--cream)]/80 hover:bg-white/5 hover:text-[var(--cream)]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {links.slice(2).map((link) => (
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
            {links.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg text-[var(--cream)]"
              >
                {link.label}
              </Link>
            ))}

            <div>
              <button
                type="button"
                aria-expanded={mobileRegisterOpen}
                onClick={() => setMobileRegisterOpen((value) => !value)}
                className={`inline-flex items-center gap-2 text-lg ${
                  registerActive ? 'text-[var(--champagne)]' : 'text-[var(--cream)]'
                }`}
              >
                Register
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${
                    mobileRegisterOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileRegisterOpen ? (
                <div className="mt-3 flex flex-col gap-3 border-l border-white/10 pl-4">
                  {registrationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-base ${
                        link.match(pathname)
                          ? 'text-[var(--champagne)]'
                          : 'text-[var(--cream)]/80'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {links.slice(2).map((link) => (
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

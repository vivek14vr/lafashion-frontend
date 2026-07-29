import type { Metadata } from 'next'
import { DesignerRegistrationForm } from '@/components/designer-registration-form'

export const metadata: Metadata = {
  title: 'Designer Registration',
  description:
    'LA Fashion Closet designer registration — apply to present your collection on the Fashion Beyond Borders runway.',
}

export default function DesignerRegisterPage() {
  return (
    <div className="bg-[var(--background)]">
      <section className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-28 md:pb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">
            Open call
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-[1.05] text-[var(--cream)] md:text-6xl">
            Designer Registration
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)] md:text-base">
            Welcome to LA Fashion Closet&apos;s Designer Registration. We&apos;re excited to connect
            with designers who are passionate about fashion, creativity, and style. Fill out the
            form below to take the first step toward becoming part of our dynamic fashion community.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <DesignerRegistrationForm />
      </section>
    </div>
  )
}

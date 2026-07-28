import type { Metadata } from 'next'
import { ModelRegistrationForm } from '@/components/model-registration-form'

export const metadata: Metadata = {
  title: 'Model Registration',
  description:
    'LA Fashion Closet model registration — apply to join runway productions and Fashion Beyond Borders events.',
}

export default function RegisterPage() {
  return (
    <div className="bg-[var(--background)]">
      <section className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-28 md:pb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">
            Open call
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-[1.05] text-[var(--cream)] md:text-6xl">
            Model Registration
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)] md:text-base">
            Welcome to LA Fashion Closet&apos;s Model Registration. We&apos;re excited to connect
            with aspiring and professional models who are passionate about fashion, creativity, and
            style. Fill out the form below to take the first step toward becoming part of our
            dynamic fashion community.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <ModelRegistrationForm />
      </section>
    </div>
  )
}

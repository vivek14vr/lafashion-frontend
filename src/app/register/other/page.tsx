import type { Metadata } from 'next'
import { CommunityRegistrationForm } from '@/components/community-registration-form'

export const metadata: Metadata = {
  title: 'Other Registrations',
  description:
    'LA Fashion Closet registrations for creators, media, performers, influencers, volunteers, sponsors, MUAs, and more.',
}

export default function OtherRegisterPage() {
  return (
    <div className="bg-[var(--background)]">
      <section className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-28 md:pb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Open call</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-[1.05] text-[var(--cream)] md:text-6xl">
            Other Registrations
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)] md:text-base">
            Welcome to LA Fashion Closet&apos;s Registration. We&apos;re excited to connect with
            aspiring professionals and brands who are passionate about fashion, creativity, and
            style. Fill out the form below to take the first step toward becoming part of our
            dynamic fashion community.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <CommunityRegistrationForm />
      </section>
    </div>
  )
}

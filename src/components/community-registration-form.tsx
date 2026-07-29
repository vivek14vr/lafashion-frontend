'use client'

import { useMemo, useState, type FormEvent } from 'react'
import {
  submitCommunityRegistration,
  type CommunityRegistrationPayload,
} from '@/lib/api'

const ROLES = [
  { label: 'Content Creator', value: 'content_creator' },
  { label: 'Press/Media', value: 'press_media' },
  { label: 'Performer', value: 'performer' },
  { label: 'Influencer', value: 'influencer' },
  { label: 'Volunteer', value: 'volunteer' },
  { label: 'Sponsor', value: 'sponsor' },
  { label: 'MUA', value: 'mua' },
  { label: 'Other', value: 'other' },
] as const

const LOCATIONS = [
  { label: 'NYFW', value: 'nyfw' },
  { label: 'Los Angeles FW', value: 'la_fw' },
  { label: 'Las Vegas FW', value: 'las_vegas_fw' },
  { label: 'Milan FW', value: 'milan_fw' },
  { label: 'Paris FW', value: 'paris_fw' },
  { label: 'London FW', value: 'london_fw' },
  { label: 'Delhi FW', value: 'delhi_fw' },
] as const

const CONSENTS = [
  {
    key: 'consentUnpaid' as const,
    text: 'Yes, I am aware that participation in events powered by LA Fashion Closet is not a paid opportunity but provides me a platform for exposure. I agree to participate in events powered by LA Fashion Closet with this understanding. Additionally, I understand that I will have to bear any travel and/or accommodation expenses, including any other expenses related to my participation in the event. LA Fashion Closet is not responsible for any expenses incurred.',
  },
  {
    key: 'consentCredit' as const,
    text: 'Yes, I agree When posting images/videos to credit all Designers, Hair and makeup Teams, Photographer/Videographer, Sponsors, and any relevant teams @lafcfashionweek @lafashioncloset Production, Staff & Partners. I will provide credit in the form of mentions in comments, tags, stories, posting, and reposts when sharing images to the best of my understanding.',
  },
  {
    key: 'consentLikeness' as const,
    text: 'I acknowledge that this is an open-call event during which photography and videography will occur. I hereby relinquish all rights to any photograph and/or video that includes my likeness to LA Fashion Closet, as well as their representatives. I consent to the editing and publication of these photos and videos on various platforms, including social media, websites, blogs, newsletters, magazines, or any other print/digital media. I waive any rights to review or approve the final products.',
  },
  {
    key: 'consentMedia' as const,
    text: 'I, Photographer/Videographer/Other Media, hereby grant and authorize LA Fashion Closet the right to take, edit, alter, copy, exhibit, publish, distribute and make use of any and all pictures or video taken by myself to be used in and/or for legally promotional materials including, but not limited to, newsletters, flyers, posters, brochures, fundraising letters, annual reports, press kits and submissions to journalists, websites, magazines, social networking sites and other print and digital communications, without payment or any other consideration. This authorization extends to all languages, media, formats and markets now known or hereafter devised. This authorization shall continue indefinitely for all media submitted or captured in events by LA Fashion Closet, unless I otherwise revoke said authorization in writing. I understand and agree that these materials shall become the property of LA Fashion Closet and will not be returned. I hereby hold harmless, and release LA Fashion Closet from all liability, petitions, and causes of action which I, my heirs, representative, executors, administrators, or any other persons may make while acting on my behalf or on behalf of my estate. I hereby agree that I will upload all photos/videos taken by me to the drive/location as specified by LA Fashion Closet.',
  },
]

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--cream)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--champagne)]/60'
const labelClass = 'block text-xs uppercase tracking-[0.16em] text-[var(--muted)]'
const sectionTitleClass =
  'font-[family-name:var(--font-display)] text-2xl text-[var(--cream)] md:text-3xl'

type FormState = {
  role: string
  roleOther: string
  title: string
  firstName: string
  lastName: string
  phone: string
  email: string
  instagramUrl: string
  gender: string
  genderOther: string
  city: string
  state: string
  locations: string[]
  isMinor: string
  consentUnpaid: boolean
  consentCredit: boolean
  consentLikeness: boolean
  consentMedia: boolean
  signatureName: string
  signatureDate: string
}

const todayLocal = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const initialState = (): FormState => ({
  role: '',
  roleOther: '',
  title: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  instagramUrl: '',
  gender: '',
  genderOther: '',
  city: '',
  state: '',
  locations: [],
  isMinor: '',
  consentUnpaid: false,
  consentCredit: false,
  consentLikeness: false,
  consentMedia: false,
  signatureName: '',
  signatureDate: todayLocal(),
})

export function CommunityRegistrationForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  const toggleLocation = (value: string) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.includes(value)
        ? prev.locations.filter((v) => v !== value)
        : [...prev.locations, value],
    }))
  }

  const payload = useMemo((): CommunityRegistrationPayload => {
    return {
      role: form.role,
      ...(form.role === 'other' && form.roleOther.trim()
        ? { roleOther: form.roleOther.trim() }
        : {}),
      ...(form.title ? { title: form.title } : {}),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      instagramUrl: form.instagramUrl.trim(),
      gender: form.gender,
      ...(form.gender === 'other' && form.genderOther.trim()
        ? { genderOther: form.genderOther.trim() }
        : {}),
      city: form.city.trim(),
      state: form.state.trim(),
      locations: form.locations,
      isMinor: form.isMinor,
      consentUnpaid: form.consentUnpaid,
      consentCredit: form.consentCredit,
      consentLikeness: form.consentLikeness,
      consentMedia: form.consentMedia,
      signatureName: form.signatureName.trim(),
      signatureDate: form.signatureDate,
    }
  }, [form])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (form.role === 'other' && !form.roleOther.trim()) {
      setError('Please specify your role.')
      return
    }
    if (form.locations.length === 0) {
      setError('Please select at least one fashion week location.')
      return
    }
    if (
      !form.consentUnpaid ||
      !form.consentCredit ||
      !form.consentLikeness ||
      !form.consentMedia
    ) {
      setError('Please accept all consents before submitting.')
      return
    }

    setSubmitting(true)
    try {
      await submitCommunityRegistration(payload)
      setDone(true)
      setForm(initialState())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--champagne)]/30 bg-[var(--surface)] px-6 py-12 text-center md:px-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Submitted</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--cream)]">
          Thank you for registering
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
          We received your community registration. Our team will review your details and be in touch
          if there is a fit for an upcoming production.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-8 inline-flex rounded-full border border-[var(--champagne)]/45 px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[var(--champagne)] transition hover:bg-[var(--champagne)]/10"
        >
          Submit another response
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      <section className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Step 1</p>
          <h2 className={`mt-2 ${sectionTitleClass}`}>Identity</h2>
        </div>

        <fieldset>
          <legend className={labelClass}>I am *</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ROLES.map((role) => (
              <label
                key={role.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--cream)]/90 transition hover:border-[var(--champagne)]/40"
              >
                <input
                  type="radio"
                  name="role"
                  required
                  checked={form.role === role.value}
                  onChange={() => set('role')(role.value)}
                  className="accent-[var(--champagne)]"
                />
                {role.label}
              </label>
            ))}
          </div>
        </fieldset>

        {form.role === 'other' ? (
          <label className="block">
            <span className={labelClass}>Please specify *</span>
            <input
              required
              className={fieldClass}
              value={form.roleOther}
              onChange={(e) => set('roleOther')(e.target.value)}
            />
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className={labelClass}>Title</span>
            <select
              className={fieldClass}
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
            >
              <option value="">Choose</option>
              <option value="mr">Mr.</option>
              <option value="ms">Ms.</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>First name *</span>
            <input
              required
              className={fieldClass}
              value={form.firstName}
              onChange={(e) => set('firstName')(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Last name *</span>
            <input
              required
              className={fieldClass}
              value={form.lastName}
              onChange={(e) => set('lastName')(e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Phone number *</span>
            <input
              required
              type="tel"
              className={fieldClass}
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Email address *</span>
            <input
              required
              type="email"
              className={fieldClass}
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClass}>Instagram URL *</span>
          <input
            required
            type="text"
            placeholder="https://instagram.com/..."
            className={fieldClass}
            value={form.instagramUrl}
            onChange={(e) => set('instagramUrl')(e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Gender *</span>
            <select
              required
              className={fieldClass}
              value={form.gender}
              onChange={(e) => set('gender')(e.target.value)}
            >
              <option value="">Choose</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          {form.gender === 'other' ? (
            <label className="block">
              <span className={labelClass}>Please specify</span>
              <input
                className={fieldClass}
                value={form.genderOther}
                onChange={(e) => set('genderOther')(e.target.value)}
              />
            </label>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>City *</span>
            <input
              required
              className={fieldClass}
              value={form.city}
              onChange={(e) => set('city')(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>State *</span>
            <input
              required
              className={fieldClass}
              value={form.state}
              onChange={(e) => set('state')(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="space-y-5 border-t border-[var(--border-subtle)] pt-12">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Step 2</p>
          <h2 className={`mt-2 ${sectionTitleClass}`}>Event interest</h2>
        </div>

        <fieldset>
          <legend className={labelClass}>Which location are you interested in? *</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {LOCATIONS.map((loc) => (
              <label
                key={loc.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--cream)]/90 transition hover:border-[var(--champagne)]/40"
              >
                <input
                  type="checkbox"
                  checked={form.locations.includes(loc.value)}
                  onChange={() => toggleLocation(loc.value)}
                  className="accent-[var(--champagne)]"
                />
                {loc.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block max-w-md">
          <span className={labelClass}>Are you a minor under 18? *</span>
          <select
            required
            className={fieldClass}
            value={form.isMinor}
            onChange={(e) => set('isMinor')(e.target.value)}
          >
            <option value="">Choose</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </section>

      <section className="space-y-5 border-t border-[var(--border-subtle)] pt-12">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Step 3</p>
          <h2 className={`mt-2 ${sectionTitleClass}`}>Consents & signature</h2>
        </div>
        <div className="space-y-4">
          {CONSENTS.map((consent) => (
            <label
              key={consent.key}
              className="flex cursor-pointer gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
            >
              <input
                type="checkbox"
                checked={form[consent.key]}
                onChange={(e) => set(consent.key)(e.target.checked)}
                className="mt-1 shrink-0 accent-[var(--champagne)]"
                required
              />
              <span className="text-sm leading-relaxed text-[var(--cream)]/80">{consent.text}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Signature (type full name) *</span>
            <input
              required
              className={fieldClass}
              value={form.signatureName}
              onChange={(e) => set('signatureName')(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Date *</span>
            <input
              required
              type="date"
              className={fieldClass}
              value={form.signatureDate}
              onChange={(e) => set('signatureDate')(e.target.value)}
            />
          </label>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-full bg-[var(--champagne)] px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#14120f] transition hover:bg-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit registration'}
      </button>
    </form>
  )
}

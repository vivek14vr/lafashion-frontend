'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { submitRegistration, type RegistrationPayload } from '@/lib/api'

const LOCATIONS = [
  { label: 'NYFW', value: 'nyfw' },
  { label: 'Los Angeles FW', value: 'la_fw' },
  { label: 'Las Vegas FW', value: 'las_vegas_fw' },
  { label: 'Milan FW', value: 'milan_fw' },
  { label: 'Paris FW', value: 'paris_fw' },
  { label: 'Cannes FW', value: 'cannes_fw' },
  { label: 'Delhi FW', value: 'delhi_fw' },
] as const

const DRESS_SIZES = ['0', '2', '4', '6', '8', '10', '12', '14', '16'] as const
const SUIT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const

const CONSENTS = [
  {
    key: 'consentUnpaid' as const,
    text: 'Yes, I am aware that participation in events powered by LA Fashion Closet is not a paid opportunity but provides me a platform for exposure. I agree to participate in events powered by LA Fashion Closet with this understanding. Additionally, I understand that I will have to bear any travel and/or accommodation expenses, including any other expenses related to my participation in the event. LA Fashion Closet is not responsible for any expenses incurred by the model.',
  },
  {
    key: 'consentExpenses' as const,
    text: 'Additionally, I understand that I will have to bear any travel and/or accommodation expenses, including any other expenses related to my participation in the event. LA Fashion Closet is not responsible for any expenses incurred by the model.',
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
    key: 'consentRelease' as const,
    text: 'I, Model, in consideration of my engagement as a model, and for other good and valuable consideration herein acknowledged as received, hereby grant the following rights and permissions to LA Fashion Closet, their legal representatives, and assigns, those for whom Photographer/Videographer is acting, and those acting with his/her authority and permission. I hereby grant to them the unalterable, perpetual and unrestricted right and permission to take, use, reuse, publish, and republish photographic portraits or pictures or videos of me or in which I may be included, in whole or in part, or composite or distorted in character or form, without restriction as to changes or alterations, in conjunction with my own or a fictitious name. I grant them the unalterable, perpetual and unrestricted right and permission to do so in any and all media now or hereafter known. This includes but is not limited to print media and internet distribution for illustration, exhibit, promotion, art, editorial, advertising, trade, magazine, social media or any other purpose whatsoever. I hereby give my consent for the digital compositing or distortion of portraits or pictures or videos, including but not limited to changes or alterations in terms of color, size, shape, perspective, context, foreground or background. I also consent to the use of any published materials in conjunction with such photographs or videos. I waive any right to inspect or approve the finished product or products, and the advertising copy or other matter that may be used in connection with them, or the use to which they may be applied. I release, discharge, and agree to hold harmless LA Fashion Closet and all persons acting under his/her permission or authority from any liability by virtue of any blurring, distortion, alteration, optical illusion, or use in composite form. This is valid for all media submitted or captured in events by LA Fashion Closet. I hereby warrant that I am of full age and have the right to contract in my own name. I have read the above release, and agreement before its execution and I am familiar with its contents. This document is binding upon me and my heirs, legal representatives, and assigns.',
  },
]

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--cream)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--champagne)]/60'
const labelClass = 'block text-xs uppercase tracking-[0.16em] text-[var(--muted)]'
const sectionTitleClass =
  'font-[family-name:var(--font-display)] text-2xl text-[var(--cream)] md:text-3xl'

type FormState = {
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
  height: string
  weight: string
  bustChest: string
  waist: string
  hips: string
  dressSize: string
  suitSize: string
  shoeSize: string
  runwayExperience: string
  locations: string[]
  publishedModel: string
  publishedWhere: string
  agencyStatus: string
  isMinor: string
  consentUnpaid: boolean
  consentExpenses: boolean
  consentCredit: boolean
  consentLikeness: boolean
  consentRelease: boolean
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
  height: '',
  weight: '',
  bustChest: '',
  waist: '',
  hips: '',
  dressSize: '',
  suitSize: '',
  shoeSize: '',
  runwayExperience: '',
  locations: [],
  publishedModel: '',
  publishedWhere: '',
  agencyStatus: '',
  isMinor: '',
  consentUnpaid: false,
  consentExpenses: false,
  consentCredit: false,
  consentLikeness: false,
  consentRelease: false,
  signatureName: '',
  signatureDate: todayLocal(),
})

export function ModelRegistrationForm() {
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

  const payload = useMemo((): RegistrationPayload => {
    return {
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
      height: form.height.trim(),
      weight: form.weight.trim(),
      bustChest: form.bustChest.trim(),
      waist: form.waist.trim(),
      hips: form.hips.trim(),
      dressSize: form.dressSize,
      suitSize: form.suitSize,
      shoeSize: form.shoeSize.trim(),
      runwayExperience: form.runwayExperience,
      locations: form.locations,
      publishedModel: form.publishedModel,
      ...(form.publishedModel === 'yes'
        ? { publishedWhere: form.publishedWhere.trim() }
        : {}),
      agencyStatus: form.agencyStatus,
      isMinor: form.isMinor,
      consentUnpaid: form.consentUnpaid,
      consentExpenses: form.consentExpenses,
      consentCredit: form.consentCredit,
      consentLikeness: form.consentLikeness,
      consentRelease: form.consentRelease,
      signatureName: form.signatureName.trim(),
      signatureDate: form.signatureDate,
    }
  }, [form])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (form.locations.length === 0) {
      setError('Please select at least one fashion week location.')
      return
    }
    if (form.publishedModel === 'yes' && !form.publishedWhere.trim()) {
      setError('Please share where you were published.')
      return
    }
    if (
      !form.consentUnpaid ||
      !form.consentExpenses ||
      !form.consentCredit ||
      !form.consentLikeness ||
      !form.consentRelease
    ) {
      setError('Please accept all consents before submitting.')
      return
    }

    setSubmitting(true)
    try {
      await submitRegistration(payload)
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
          We received your model registration. Our team will review your details and be in touch if
          there is a fit for an upcoming production.
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
      {/* Identity */}
      <section className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Step 1</p>
          <h2 className={`mt-2 ${sectionTitleClass}`}>Identity</h2>
        </div>
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

      {/* Measurements */}
      <section className="space-y-5 border-t border-[var(--border-subtle)] pt-12">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Step 2</p>
          <h2 className={`mt-2 ${sectionTitleClass}`}>Measurements</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Height (ft) *</span>
            <input
              required
              placeholder={`Example: 5'6"`}
              className={fieldClass}
              value={form.height}
              onChange={(e) => set('height')(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Weight (lbs) *</span>
            <input
              required
              className={fieldClass}
              value={form.weight}
              onChange={(e) => set('weight')(e.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelClass}>Bust/Chest (in) *</span>
            <input
              required
              className={fieldClass}
              value={form.bustChest}
              onChange={(e) => set('bustChest')(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Waist (in) *</span>
            <input
              required
              className={fieldClass}
              value={form.waist}
              onChange={(e) => set('waist')(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Hips (in) *</span>
            <input
              required
              className={fieldClass}
              value={form.hips}
              onChange={(e) => set('hips')(e.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelClass}>Dress size (US) *</span>
            <select
              required
              className={fieldClass}
              value={form.dressSize}
              onChange={(e) => set('dressSize')(e.target.value)}
            >
              <option value="">Choose</option>
              {DRESS_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Dress/Suit size *</span>
            <select
              required
              className={fieldClass}
              value={form.suitSize}
              onChange={(e) => set('suitSize')(e.target.value)}
            >
              <option value="">Choose</option>
              {SUIT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Shoe size (US) *</span>
            <input
              required
              className={fieldClass}
              value={form.shoeSize}
              onChange={(e) => set('shoeSize')(e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* Experience */}
      <section className="space-y-5 border-t border-[var(--border-subtle)] pt-12">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Step 3</p>
          <h2 className={`mt-2 ${sectionTitleClass}`}>Experience</h2>
        </div>
        <label className="block max-w-md">
          <span className={labelClass}>Fashion Week runway experience? *</span>
          <select
            required
            className={fieldClass}
            value={form.runwayExperience}
            onChange={(e) => set('runwayExperience')(e.target.value)}
          >
            <option value="">Choose</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
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
          <span className={labelClass}>Are you a published model? *</span>
          <select
            required
            className={fieldClass}
            value={form.publishedModel}
            onChange={(e) => set('publishedModel')(e.target.value)}
          >
            <option value="">Choose</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        {form.publishedModel === 'yes' ? (
          <label className="block">
            <span className={labelClass}>Where did you get published? *</span>
            <textarea
              required
              rows={3}
              className={fieldClass}
              value={form.publishedWhere}
              onChange={(e) => set('publishedWhere')(e.target.value)}
            />
          </label>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Represented by a modeling agency? *</span>
            <select
              required
              className={fieldClass}
              value={form.agencyStatus}
              onChange={(e) => set('agencyStatus')(e.target.value)}
            >
              <option value="">Choose</option>
              <option value="exclusive">Yes, Exclusive</option>
              <option value="non_exclusive">Yes, Non Exclusive</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="block">
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
        </div>
      </section>

      {/* Consents */}
      <section className="space-y-5 border-t border-[var(--border-subtle)] pt-12">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Step 4</p>
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

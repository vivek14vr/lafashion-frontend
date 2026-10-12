import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@/components/rich-text'
import { getPressMediaUrl, getPressReleaseBySlug } from '@/lib/api'
import type { PressReleaseItem } from '@/lib/types'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const release = await getPressReleaseBySlug(slug).catch(() => null)
  return release ? { title: `${release.title} · ${release.designerName}`, description: release.excerpt } : { title: 'Press release' }
}

function mediaValue(value: unknown) { return getPressMediaUrl(value as PressReleaseItem['portraitImage']) }

function PressReleaseUnavailable({ slug }: { slug: string }) {
  return <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center"><p className="text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Press releases</p><h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl text-[var(--cream)]">This profile is temporarily unavailable.</h1><p className="mt-5 text-sm leading-relaxed text-[var(--muted)]">Please try again, or return to the Press releases page.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><a href={`/press-releases/${encodeURIComponent(slug)}`} className="rounded-full border border-[var(--champagne)]/50 px-5 py-3 text-xs uppercase tracking-[0.16em] text-[var(--champagne)]">Try again</a><Link href="/press-releases" className="rounded-full border border-[var(--border-subtle)] px-5 py-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">All press releases</Link></div></main>
}

export default async function PressReleaseDetailPage({ params }: Props) {
  const { slug } = await params
  let release: PressReleaseItem | null = null
  let unavailable = false
  try {
    release = await getPressReleaseBySlug(slug)
  } catch {
    unavailable = true
  }
  if (unavailable) return <PressReleaseUnavailable slug={slug} />
  if (!release) notFound()
  const hero = getPressMediaUrl(release.portraitImage)
  const images = (release.images || []).map(mediaValue).filter((image): image is string => Boolean(image))
  const event = release.event && typeof release.event === 'object' ? release.event : null
  return <article className="bg-[var(--background)]"><div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-32 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><Link href="/press-releases" className="text-xs uppercase tracking-[0.18em] text-[var(--champagne)]">← All press releases</Link><p className="mt-10 text-xs uppercase tracking-[0.22em] text-[var(--champagne)]">Designer profile</p><h1 className="mt-3 font-[family-name:var(--font-display)] text-6xl leading-[.95] text-[var(--cream)] md:text-8xl">{release.title}</h1><p className="mt-5 text-lg uppercase tracking-[0.16em] text-[var(--muted)]">By {release.designerName}</p>{release.brandName ? <p className="mt-3 text-lg uppercase tracking-[0.16em] text-[var(--muted)]">{release.brandName}</p> : null}<p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--cream)]/70">{release.excerpt}</p>{event ? <p className="mt-6 text-sm text-[var(--muted)]">Participating in <span className="text-[var(--cream)]">{event.title}</span></p> : null}</div><div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">{hero ? <Image src={hero} alt={`${release.title} — ${release.designerName} portrait`} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" /> : null}</div></div><div className="mx-auto grid max-w-6xl gap-12 px-6 pb-28 lg:grid-cols-[1fr_280px]"><div className="max-w-3xl"><RichText content={release.body} /></div>{release.websiteUrl || release.instagramUrl ? <aside className="border-t border-[var(--border-subtle)] pt-6 lg:border-l lg:border-t-0 lg:pl-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--champagne)]">Connect with the designer</p>{release.websiteUrl ? <a href={release.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-5 block text-sm text-[var(--cream)] hover:text-[var(--champagne)]">Website ↗</a> : null}{release.instagramUrl ? <a href={release.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-sm text-[var(--cream)] hover:text-[var(--champagne)]">Instagram ↗</a> : null}</aside> : null}</div>{images.length ? <div className="mx-auto max-w-6xl px-6 pb-28"><p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--champagne)]">Collection / studio images</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--surface-raised)]" key={`${image}-${index}`}><Image src={image} alt={`${release.designerName} collection image ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" /></div>)}</div></div> : null}</article>
}

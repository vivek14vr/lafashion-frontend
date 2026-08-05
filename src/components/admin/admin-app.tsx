'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarDays, ChevronRight, FolderOpen, Images, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react'

type Doc = Record<string, unknown> & { id: string; createdAt?: string; updatedAt?: string }
type ListResponse = { docs: Doc[]; totalDocs: number; totalPages: number; page: number }

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/galleries', label: 'Galleries', icon: Images },
  { href: '/admin/media', label: 'Media library', icon: FolderOpen },
  { href: '/admin/registrations', label: 'Model registrations', icon: Users },
  { href: '/admin/community-registrations', label: 'Community registrations', icon: Users },
  { href: '/admin/designer-registrations', label: 'Designer registrations', icon: Users },
  { href: '/admin/home-destinations', label: 'Homepage city snaps', icon: BarChart3 },
]

const labels: Record<string, string> = {
  events: 'Events (nights & tickets)',
  galleries: 'Galleries (photo archives)',
  media: 'Media library',
  registrations: 'Model registrations',
  'community-registrations': 'Community registrations',
  'designer-registrations': 'Designer registrations',
}

function text(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'object') return 'Linked record'
  return String(value)
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, { ...init, credentials: 'include', cache: 'no-store' })
  const body = await response.json().catch(() => null)
  if (response.status === 401) throw new Error('AUTH_REQUIRED')
  if (!response.ok) throw new Error(body?.errors?.[0]?.message || body?.message || `Request failed (${response.status})`)
  return body
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  async function logout() {
    await api('/users/logout', { method: 'POST' }).catch(() => undefined)
    router.replace('/login')
  }
  return <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
    <div className="admin-sidebar__top"><Link href="/" className="admin-brand" onClick={close}><Image src="/logo.png" alt="LA Fashion Closet" width={190} height={56} unoptimized /></Link><button className="admin-icon-button admin-sidebar__close" onClick={close} aria-label="Close menu"><X size={20} /></button></div>
    <p className="admin-sidebar__label">CONTENT STUDIO</p>
    <nav>{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={close} className={pathname === href || (href !== '/admin' && pathname.startsWith(href)) ? 'is-active' : ''}><Icon size={17} /><span>{label}</span></Link>)}</nav>
    <button className="admin-logout" onClick={logout}><LogOut size={17} /> Sign out</button>
  </aside>
}

function Overview() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => { Promise.all(nav.slice(1, 7).map(async (item) => { const slug = item.href.split('/').pop()!; const response = await api(`/${slug}?limit=1`).catch(() => ({ totalDocs: 0 })); return [slug, response.totalDocs] as const })).then((items) => setCounts(Object.fromEntries(items))) }, [])
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">CONTENT STUDIO</p><h1>LA Fashion Closet</h1><p className="admin-muted">A focused workspace for the stories, images, and people behind the site.</p></div><Link href="/" className="admin-secondary">View website <ChevronRight size={16} /></Link></div><div className="admin-stat-grid">{nav.slice(1, 7).map(({ href, label, icon: Icon }) => <Link href={href} className="admin-stat" key={href}><span className="admin-stat__icon"><Icon size={19} /></span><span><strong>{counts[href.split('/').pop()!] ?? '—'}</strong><small>{label}</small></span><ChevronRight size={17} /></Link>)}</div><div className="admin-welcome"><p className="admin-eyebrow">QUICK START</p><h2>Keep the public site alive</h2><p className="admin-muted">Create an event, upload a batch of photos, then assemble those images into a gallery or homepage city card.</p><div className="admin-actions"><Link href="/admin/events/new" className="admin-primary">Create event</Link><Link href="/admin/media" className="admin-secondary">Upload media</Link></div></div></>
}

function CollectionPage({ slug }: { slug: string }) {
  const router = useRouter()
  const [data, setData] = useState<ListResponse | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const readOnly = slug.includes('registration')
  const title = labels[slug] || slug
  async function load() { const search = query.trim() ? `&where[or][0][title][contains]=${encodeURIComponent(query)}&where[or][1][email][contains]=${encodeURIComponent(query)}` : ''; try { setData(await api(`/${slug}?depth=1&limit=50&sort=-createdAt${search}`)) } catch (err) { if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login'); else setError(err instanceof Error ? err.message : 'Could not load records.') } }
  useEffect(() => { void load() }, [slug])
  const columns = useMemo(() => { const first = data?.docs[0]; if (!first) return ['id']; return Object.keys(first).filter((key) => !['id', 'updatedAt', 'createdAt', '_status'].includes(key)).slice(0, 5) }, [data])
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">WEBSITE</p><h1>{title}</h1><p className="admin-muted">{readOnly ? 'Review public submissions and remove records when needed.' : 'Manage the content shown across the public website.'}</p></div>{!readOnly && <Link href={`/admin/${slug}/new`} className="admin-primary">Create new</Link>}</div><div className="admin-toolbar"><input placeholder="Search records" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load()} /><button className="admin-secondary" onClick={() => void load()}>Search</button></div>{error ? <p className="admin-error">{error}</p> : null}<div className="admin-table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column.replace(/([A-Z])/g, ' $1')}</th>)}<th>Action</th></tr></thead><tbody>{data?.docs.map((doc) => <tr key={doc.id}>{columns.map((column) => <td key={column}>{text(doc[column])}</td>)}<td><Link className="admin-table-link" href={`/admin/${slug}/${doc.id}`}>Open</Link></td></tr>)}</tbody></table>{data && data.docs.length === 0 ? <div className="admin-empty">No records found.</div> : null}</div></>
}

function MediaPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState<ListResponse | null>(null)
  async function load() { setMedia(await api('/media?limit=60&sort=-createdAt').catch(() => null)) }
  useEffect(() => { void load() }, [])
  async function upload() { if (!files.length) return; setUploading(true); setMessage(''); let completed = 0; try { for (const file of files) { const body = new FormData(); body.append('file', file); await api('/media', { method: 'POST', body }); completed += 1; } setFiles([]); setMessage(`${completed} file${completed === 1 ? '' : 's'} uploaded successfully.`); await load() } catch (err) { setMessage(err instanceof Error ? err.message : 'Upload failed.') } finally { setUploading(false) } }
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">ASSETS</p><h1>Media library</h1><p className="admin-muted">Private S3-backed images shared by events, galleries, and homepage cards.</p></div></div><div className="admin-upload"><div><h2>Upload images</h2><p className="admin-muted">Choose one or more files, then confirm with the upload button.</p></div><input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} /><div className="admin-upload__files">{files.map((file) => <span key={file.name}>{file.name}</span>)}</div><button className="admin-primary" disabled={!files.length || uploading} onClick={() => void upload()}>{uploading ? 'Uploading…' : `Upload ${files.length || ''} file${files.length === 1 ? '' : 's'}`}</button>{message ? <p className="admin-muted">{message}</p> : null}</div><div className="admin-media-grid">{media?.docs.map((doc) => <div className="admin-media-card" key={doc.id}><div className="admin-media-card__image">{doc.url ? <img src={String(doc.url)} alt={String(doc.alt || doc.filename || '')} /> : null}</div><strong>{String(doc.filename || doc.id)}</strong><small>{text(doc.filesize)}</small></div>)}</div></>
}

export function AdminApp({ section }: { section?: string[] }) {
  const [open, setOpen] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const slug = section?.[0]

  useEffect(() => {
    let active = true
    // Payload authenticates with a signed JWT cookie. `/users/me` verifies that
    // JWT on the backend before returning the current admin user.
    api('/users/refresh-token', { method: 'POST' })
      .then(() => api('/users/me'))
      .then(() => {
        if (active) setSessionReady(true)
      })
      .catch(() => {
        if (active) window.location.replace('/login')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!sessionReady) return

    // Renew the Payload JWT well before its 30-day expiry. The token stays
    // HttpOnly; JavaScript never reads or stores it.
    const refreshEvery = 12 * 60 * 60 * 1000
    const timer = window.setInterval(() => {
      api('/users/refresh-token', { method: 'POST' }).catch(() => window.location.replace('/login'))
    }, refreshEvery)

    return () => window.clearInterval(timer)
  }, [sessionReady])

  if (!sessionReady) {
    return <main className="admin-session-loading"><span>Verifying secure session…</span></main>
  }

  return <div className="admin-shell"><Sidebar open={open} close={() => setOpen(false)} /><div className="admin-main"><header className="admin-topbar"><button className="admin-icon-button admin-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div><span className="admin-topbar__crumb">LA Fashion Closet</span>{slug ? <><ChevronRight size={14} /><span>{labels[slug] || slug}</span></> : <><ChevronRight size={14} /><span>Overview</span></>}</div><Link href="/" className="admin-topbar__home">Visit site</Link></header><main className="admin-content">{!slug ? <Overview /> : slug === 'media' ? <MediaPage /> : <CollectionPage slug={slug} />}</main></div>{open ? <button className="admin-backdrop" onClick={() => setOpen(false)} aria-label="Close menu" /> : null}</div>
}

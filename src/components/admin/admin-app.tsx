'use client'

/* eslint-disable @next/next/no-img-element -- Admin previews use short-lived S3/Payload URLs and native lazy loading. */

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BarChart3, CalendarDays, ChevronRight, Download, FolderOpen, Images, LayoutDashboard, LogOut, Menu, Pencil, Users, X } from 'lucide-react'

type Doc = Record<string, unknown> & { id: string; createdAt?: string; updatedAt?: string }
type ListResponse = { docs: Doc[]; totalDocs: number; totalPages: number; page: number }

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/galleries', label: 'Galleries', icon: Images },
  { href: '/admin/media', label: 'Media library', icon: FolderOpen },
  { href: '/admin/press-releases', label: 'Press releases', icon: Pencil },
  { href: '/admin/registrations', label: 'Model registrations', icon: Users },
  { href: '/admin/community-registrations', label: 'Community registrations', icon: Users },
  { href: '/admin/designer-registrations', label: 'Designer registrations', icon: Users },
  { href: '/admin/home-destinations', label: 'Homepage city snaps', icon: BarChart3 },
]

const overviewNav = nav.filter(({ href }) => href !== '/admin' && href !== '/admin/home-destinations')

const labels: Record<string, string> = {
  events: 'Events (nights & tickets)',
  galleries: 'Galleries (photo archives)',
  media: 'Media library',
  'press-releases': 'Press releases',
  registrations: 'Model registrations',
  'community-registrations': 'Community registrations',
  'designer-registrations': 'Designer registrations',
  'home-destinations': 'Homepage city snaps',
}

type AdminLoaderContextValue = {
  startLoading: (message?: string) => () => void
}

const AdminLoaderContext = createContext<AdminLoaderContextValue>({
  startLoading: () => () => undefined,
})

function useAdminLoader() {
  return useContext(AdminLoaderContext)
}

function AdminLoadingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0)
  const [message, setMessage] = useState('Working…')
  const startLoading = useCallback((nextMessage = 'Working…') => {
    setMessage(nextMessage)
    setPending((count) => count + 1)
    let stopped = false
    return () => {
      if (stopped) return
      stopped = true
      setPending((count) => Math.max(0, count - 1))
    }
  }, [])

  return <AdminLoaderContext.Provider value={{ startLoading }}>
    {children}
    {pending > 0 ? <div className="admin-action-loader" role="status" aria-live="polite" aria-busy="true"><div className="admin-action-loader__panel"><span className="admin-action-loader__spinner" /><span>{message}</span></div></div> : null}
  </AdminLoaderContext.Provider>
}

const locationLabels: Record<string, string> = {
  nyfw: 'New York Fashion Week',
  la_fw: 'Los Angeles Fashion Week',
  las_vegas_fw: 'Las Vegas Fashion Week',
  milan_fw: 'Milan Fashion Week',
  paris_fw: 'Paris Fashion Week',
  london_fw: 'London Fashion Week',
  delhi_fw: 'Delhi Fashion Week',
  india_fw: 'India Fashion Week',
  cannes_fw: 'Cannes Fashion Week',
}

function text(value: unknown): string {
  if (value == null) return '—'
  if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === 'string' ? (locationLabels[item] || item) : text(item)).join(', ') : '—'
  if (typeof value === 'object') return 'Linked record'
  return String(value)
}

function repairMojibake(value: string): string {
  const replacements: Array<[string, string]> = [
    ['\u00e2\u20ac\u2122', '\u2019'],
    ['\u00e2\u20ac\u00b3', '\u2033'],
    ['\u00e2\u20ac\u009d', '\u201d'],
    ['\u00e2\u20ac\u009c', '\u201c'],
    ['\u00e2\u20ac\u2013', '\u2013'],
    ['\u00e2\u20ac\u2014', '\u2014'],
  ]
  let repaired = value
  for (const [broken, corrected] of replacements) repaired = repaired.replaceAll(broken, corrected)
  if (repaired !== value) return repaired
  if (!/[ÃÂâð�]/.test(value)) return value
  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => character.charCodeAt(0) & 0xff)
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return value
  }
}

function relationId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id)
  return ''
}

function withAdminPreviewUrl(doc: Doc): Doc {
  const sizes = doc.sizes as Record<string, { url?: unknown }> | undefined
  const generatedThumbnail = sizes?.adminThumbnail?.url

  if (typeof generatedThumbnail === 'string' && generatedThumbnail) {
    return { ...doc, url: generatedThumbnail }
  }

  const rawUrl = typeof doc.url === 'string' ? doc.url : ''
  if (!rawUrl) return doc

  try {
    const url = new URL(rawUrl)
    if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/image/upload/')) {
      url.pathname = url.pathname.replace(
        '/image/upload/',
        '/image/upload/w_360,h_360,c_fill,f_auto,q_auto/',
      )
      return { ...doc, url: url.toString() }
    }
  } catch {
    // Relative and non-standard URLs are already suitable for the existing proxy.
  }

  return doc
}

function isPrivatePressMedia(doc: Doc | undefined): boolean {
  if (!doc || typeof doc.url !== 'string' || !doc.url) return false
  try {
    const rawURL = doc.url.trim()
    const url = new URL(rawURL, window.location.origin)
    const isRelativePayloadFile = rawURL.startsWith('/api/media/file/')
    const isTrustedPayloadFile = url.pathname.startsWith('/api/media/file/') && (
      isRelativePayloadFile ||
      url.origin === window.location.origin ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1'
    )
    return isTrustedPayloadFile || url.hostname.endsWith('.amazonaws.com')
  } catch {
    return false
  }
}

function localDateTime(value: unknown): string {
  if (!value) return ''
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, { ...init, credentials: 'include', cache: 'no-store' })
  const body = await response.json().catch(() => null)
  if (response.status === 401) throw new Error('AUTH_REQUIRED')
  if (!response.ok) throw new Error(body?.errors?.[0]?.message || body?.message || `Request failed (${response.status})`)
  return body
}

async function compressImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|webp)$/i.test(file.type) || file.size < 750 * 1024 || typeof createImageBitmap !== 'function') return file
  try {
    const bitmap = await createImageBitmap(file)
    const maxDimension = 2400
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, 0.82))
    if (!blob || blob.size >= file.size) return file
    const extension = outputType === 'image/webp' ? 'webp' : 'jpg'
    const name = file.name.replace(/\.[^.]+$/, '') + `.${extension}`
    return new File([blob], name, { type: outputType, lastModified: file.lastModified })
  } catch {
    return file
  }
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { startLoading } = useAdminLoader()
  async function logout() {
    const stopLoading = startLoading('Signing out…')
    try {
      await api('/users/logout', { method: 'POST' }).catch(() => undefined)
      router.replace('/login')
    } finally {
      stopLoading()
    }
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
  useEffect(() => { Promise.all(overviewNav.map(async (item) => { const slug = item.href.split('/').pop()!; const response = await api(`/${slug}?limit=1`).catch(() => ({ totalDocs: 0 })); return [slug, response.totalDocs] as const })).then((items) => setCounts(Object.fromEntries(items))) }, [])
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">CONTENT STUDIO</p><h1>LA Fashion Closet</h1><p className="admin-muted">A focused workspace for the stories, images, and people behind the site.</p></div><Link href="/" className="admin-secondary">View website <ChevronRight size={16} /></Link></div><div className="admin-stat-grid">{overviewNav.map(({ href, label, icon: Icon }) => <Link href={href} className="admin-stat" key={href}><span className="admin-stat__icon"><Icon size={19} /></span><span><strong>{counts[href.split('/').pop()!] ?? '—'}</strong><small>{label}</small></span><ChevronRight size={17} /></Link>)}</div><div className="admin-welcome"><p className="admin-eyebrow">QUICK START</p><h2>Keep the public site alive</h2><p className="admin-muted">Create an event, upload a batch of photos, then assemble those images into a gallery or homepage city card.</p><div className="admin-actions"><Link href="/admin/events/new" className="admin-primary">Create event</Link><Link href="/admin/media" className="admin-secondary">Upload media</Link></div></div></>
}

function CollectionPage({ slug }: { slug: string }) {
  const router = useRouter()
  const { startLoading } = useAdminLoader()
  const [data, setData] = useState<ListResponse | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const readOnly = slug.includes('registration')
  const isSubmission = readOnly
  const title = labels[slug] || slug
  const buildQuery = useCallback((searchTerm = '', nextStatus = '', from = '', to = '', page = 1, limit = 50) => {
    const params = new URLSearchParams({ depth: '1', limit: String(limit), page: String(page), sort: '-createdAt' })
    const term = searchTerm.trim()
    if (term) {
      const searchFields = slug === 'press-releases'
        ? ['title', 'designerName', 'brandName']
        : ['title', 'email']
      searchFields.forEach((field, index) => {
        params.set(`where[or][${index}][${field}][contains]`, term)
      })
    }
    if (isSubmission && nextStatus) params.set('where[status][equals]', nextStatus)
    if (isSubmission && from) {
      const start = new Date(`${from}T00:00:00`)
      if (!Number.isNaN(start.getTime())) params.set('where[createdAt][greater_than_equal]', start.toISOString())
    }
    if (isSubmission && to) {
      const end = new Date(`${to}T00:00:00`)
      if (!Number.isNaN(end.getTime())) params.set('where[createdAt][less_than]', new Date(end.getTime() + 86_400_000).toISOString())
    }
    return params.toString()
  }, [isSubmission, slug])
  const load = useCallback(async (searchTerm = '', nextStatus = '', from = '', to = '') => { const stopLoading = startLoading('Loading records…'); try { setError(''); setData(await api(`/${slug}?${buildQuery(searchTerm, nextStatus, from, to)}`)) } catch (err) { if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login'); else setError(err instanceof Error ? err.message : 'Could not load records.') } finally { stopLoading() } }, [buildQuery, router, slug, startLoading])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])
  async function removeRecord(doc: Doc) {
    if (slug !== 'events' && slug !== 'press-releases') return
    const label = slug === 'press-releases' ? 'press release' : 'event'
    const name = String(doc.title || doc.designerName || doc.email || 'this record')
    if (!window.confirm(`Delete “${name}” permanently?`)) return
    setDeleting(doc.id)
    const stopLoading = startLoading(`Deleting ${label}…`)
    try {
      await api(`/${slug}/${doc.id}`, { method: 'DELETE' })
      setData((current) => current ? { ...current, docs: current.docs.filter((item) => item.id !== doc.id), totalDocs: Math.max(0, current.totalDocs - 1) } : current)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login')
      else setError(err instanceof Error ? err.message : `Could not delete ${label}.`)
    } finally {
      setDeleting(null)
      stopLoading()
    }
  }
  async function updateSubmissionStatus(doc: Doc, status: string) {
    if (!status || status === String(doc.status || 'new')) return
    setUpdatingStatus(doc.id)
    const stopLoading = startLoading('Updating status…')
    try {
      await api(`/${slug}/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      setData((current) => current ? { ...current, docs: current.docs.map((item) => item.id === doc.id ? { ...item, status } : item) } : current)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login')
      else setError(err instanceof Error ? err.message : 'Could not update status.')
    } finally {
      setUpdatingStatus(null)
      stopLoading()
    }
  }
  function csvValue(field: string, value: unknown): string {
    if (value == null) return ''
    if (field.toLowerCase() === 'locations') {
      const locations = Array.isArray(value) ? value : [value]
      return locations.map((location) => locationLabels[String(location)] || String(location)).join(', ')
    }
    if (/date|At$/i.test(field)) {
      const date = new Date(String(value))
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
    }
    if (typeof value === 'object') return JSON.stringify(value)
    return repairMojibake(String(value))
  }
  async function downloadCsv() {
    setExporting(true)
    const stopLoading = startLoading('Preparing CSV…')
    try {
      const records: Doc[] = []
      let page = 1
      let totalPages = 1
      do {
        const response = await api(`/${slug}?${buildQuery(query, statusFilter, dateFrom, dateTo, page, 100)}`) as ListResponse
        records.push(...(response.docs || []))
        totalPages = response.totalPages || 1
        page += 1
      } while (page <= totalPages)
      if (!records.length) {
        setError('There are no records matching the selected filters.')
        return
      }
      const fields = Array.from(new Set(records.flatMap((record) => Object.keys(record)))).filter((field) => !['id', 'signature'].includes(field.toLowerCase()))
      const escape = (field: string, value: unknown) => `"${csvValue(field, value).replaceAll('"', '""')}"`
      const csv = [fields.map((field) => escape(field, field)).join(','), ...records.map((record) => fields.map((field) => escape(field, record[field])).join(','))].join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${slug}-${dateFrom || 'all'}${dateTo ? `-to-${dateTo}` : ''}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login')
      else setError(err instanceof Error ? err.message : 'Could not download CSV.')
    } finally {
      setExporting(false)
      stopLoading()
    }
  }
  const columns = useMemo(() => { const first = data?.docs[0]; if (!first) return ['id']; return Object.keys(first).filter((key) => !['id', 'updatedAt', 'createdAt', '_status'].includes(key)).slice(0, 5) }, [data])
  const fieldLabel = (column: string) => column.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase())
  const recordLabel = data ? `${data.totalDocs} ${data.totalDocs === 1 ? 'record' : 'records'}` : 'Loading records…'
  const statuses = [{ label: 'New submission', value: 'new' }, { label: 'Contacted', value: 'contacted' }, { label: 'Shortlisted', value: 'shortlisted' }, { label: 'Approved', value: 'approved' }, { label: 'Rejected', value: 'rejected' }, { label: 'Archived', value: 'archived' }]
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">WEBSITE</p><h1>{title}</h1><p className="admin-muted">{readOnly ? 'Review submissions and move each applicant through your workflow.' : 'Manage the content shown across the public website.'}</p></div>{!readOnly && <Link href={`/admin/${slug}/new`} className="admin-primary">Create new</Link>}</div><div className="admin-toolbar"><label className="sr-only" htmlFor="admin-record-search">Search records</label><input id="admin-record-search" placeholder={slug === 'press-releases' ? 'Search by title, designer, or brand' : 'Search by title or email'} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load(query, statusFilter, dateFrom, dateTo)} />{isSubmission ? <><label className="sr-only" htmlFor="admin-status-filter">Filter by submission status</label><select id="admin-status-filter" className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><label className="admin-date-filter">From<input aria-label="Submitted from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label><label className="admin-date-filter">To<input aria-label="Submitted to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} /></label></> : null}<button type="button" className="admin-secondary" onClick={() => void load(query, statusFilter, dateFrom, dateTo)}>Apply filters</button>{isSubmission ? <button type="button" className="admin-secondary admin-download" disabled={exporting} onClick={() => void downloadCsv()}><Download size={16} />{exporting ? 'Preparing…' : 'Download CSV'}</button> : null}</div>{error ? <p className="admin-error" role="alert">{error}</p> : null}<div className="admin-table-meta"><strong>{recordLabel}</strong><span>{data?.docs.length ? 'Select Open to review the full record.' : 'Your saved records will appear here.'}</span></div><div className="admin-table-wrap"><table><caption className="sr-only">{title}</caption><thead><tr>{columns.map((column) => <th key={column} scope="col">{fieldLabel(column)}</th>)}<th scope="col">Action</th></tr></thead><tbody>{data?.docs.map((doc) => <tr key={doc.id}>{columns.map((column) => <td key={column}>{column === 'status' && isSubmission ? <select className="admin-status-select" aria-label={`Update status for ${text(doc.title || doc.email || doc.id)}`} value={String(doc.status || 'new')} disabled={updatingStatus === doc.id} onChange={(event) => void updateSubmissionStatus(doc, event.target.value)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select> : text(doc[column])}</td>)}<td><div className="admin-table-actions"><Link className="admin-table-link" href={`/admin/${slug}/${doc.id}`}>Open<span className="sr-only"> {text(doc.title || doc.email || doc.id)}</span></Link>{slug === 'events' || slug === 'press-releases' ? <button type="button" className="admin-table-delete" disabled={deleting === doc.id} onClick={() => void removeRecord(doc)}>{deleting === doc.id ? 'Deleting…' : 'Delete'}</button> : null}</div></td></tr>)}</tbody></table>{data && data.docs.length === 0 ? <div className="admin-empty">No records found. Try a different search or create a new record.</div> : null}</div></>
}

function RecordDetailPage({ slug, id }: { slug: string; id: string }) {
  const router = useRouter()
  const { startLoading } = useAdminLoader()
  const [record, setRecord] = useState<Doc | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const stopLoading = startLoading('Loading record…')
    void api(`/${slug}/${id}?depth=2`)
      .then((data) => { if (active) setRecord(data) })
      .catch((err) => {
        if (!active) return
        if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login')
        else setError(err instanceof Error ? err.message : 'Could not load this record.')
      })
      .finally(stopLoading)
    return () => { active = false }
  }, [id, router, slug, startLoading])
  const entries = record ? Object.entries(record).filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key)) : []
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">RECORD</p><h1>{record ? text(record.title || record.email || labels[slug] || slug) : labels[slug] || slug}</h1><p className="admin-muted">Review the complete saved record.</p></div><Link href={`/admin/${slug}`} className="admin-secondary">← Back to list</Link></div>{error ? <p className="admin-error">{error}</p> : null}{record ? <div className="admin-record-details">{entries.map(([key, value]) => <div className="admin-record-details__row" key={key}><strong>{key.replace(/([A-Z])/g, ' $1')}</strong><pre>{Array.isArray(value) ? text(value) : typeof value === 'object' ? JSON.stringify(value, null, 2) : text(value)}</pre></div>)}</div> : null}</>
}

type EventFormData = { title: string; date: string; venue: string; excerpt: string; ticketUrl: string; portraitImage: string; bannerImage: string }

function EventForm({ id }: { id?: string }) {
  const router = useRouter()
  const { startLoading } = useAdminLoader()
  const [data, setData] = useState<EventFormData>({ title: '', date: '', venue: '', excerpt: '', ticketUrl: '', portraitImage: '', bannerImage: '' })
  const [media, setMedia] = useState<Doc[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const stopLoading = startLoading(id ? 'Loading event…' : 'Loading event form…')
    const eventRequest = id ? api(`/events/${id}?depth=1`) : Promise.resolve(null)
    void Promise.all([api('/media?limit=200&sort=-createdAt'), eventRequest])
      .then(([mediaResponse, event]) => {
        if (!active) return
        setMedia(mediaResponse.docs || [])
        if (event) setData({
          title: String(event.title || ''),
          date: localDateTime(event.date),
          venue: String(event.venue || ''),
          excerpt: String(event.excerpt || ''),
          ticketUrl: String(event.ticketUrl || ''),
          portraitImage: relationId(event.portraitImage),
          bannerImage: relationId(event.bannerImage),
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load the event.'))
      .finally(stopLoading)
    return () => { active = false }
  }, [id, startLoading])
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); const stopLoading = startLoading(id ? 'Saving event…' : 'Publishing event…')
    try {
      await api(id ? `/events/${id}` : '/events', { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, _status: 'published' }) })
      router.replace('/admin/events')
    } catch (err) { setError(err instanceof Error ? err.message : `Could not ${id ? 'save' : 'create'} event.`) } finally { setSaving(false); stopLoading() }
  }
  const field = (name: keyof typeof data, label: string, type = 'text') => <label className="admin-form"><span>{label}</span><input required={['title', 'date', 'venue', 'excerpt'].includes(name)} type={type} value={data[name]} onChange={(event) => setData((current) => ({ ...current, [name]: event.target.value }))} /></label>
  const action = id ? 'Save changes' : 'Publish event'
  return <form className="admin-form admin-event-form" onSubmit={save}><div className="admin-page-heading"><div><p className="admin-eyebrow">WEBSITE</p><h1>{id ? 'Edit event' : 'Create event'}</h1><p className="admin-muted">{id ? 'Update the event details shown on the public website.' : 'Add and publish a runway night or fashion event to the website.'}</p></div><div className="admin-page-heading__actions">{id ? <Link href="/admin/events" className="admin-secondary">Cancel</Link> : null}<button className="admin-primary" disabled={saving}>{saving ? 'Saving…' : action}</button></div></div>{error ? <p className="admin-error">{error}</p> : null}<div className="admin-event-details">{field('title', 'Event title')}{field('date', 'Date & time', 'datetime-local')}{field('venue', 'Venue')}{field('excerpt', 'Summary')}{field('ticketUrl', 'Ticket booking URL')}</div><div className="admin-event-images"><MediaChoice label="Portrait image" required value={data.portraitImage} media={media} onChange={(value) => setData((current) => ({ ...current, portraitImage: value }))} /><MediaChoice label="Banner image" required value={data.bannerImage} media={media} onChange={(value) => setData((current) => ({ ...current, bannerImage: value }))} /></div><div className="admin-form-actions"><button className="admin-primary" disabled={saving}>{saving ? 'Saving…' : action}</button></div></form>
}

function GalleryForm() {
  const router = useRouter()
  const { startLoading } = useAdminLoader()
  const [data, setData] = useState({ title: '', source: 'standalone', event: '', date: '', location: '', excerpt: '', coverImage: '', images: [] as string[] })
  const [media, setMedia] = useState<Doc[]>([])
  const [events, setEvents] = useState<Doc[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [pickerFolder, setPickerFolder] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { void Promise.all([api('/media?limit=200&sort=-createdAt'), api('/globals/media-folders').catch(() => ({ folders: [] })), api('/events?limit=200&sort=-date')]).then(([mediaData, folderData, eventData]) => { setMedia(mediaData.docs || []); setFolders((folderData.folders || []).map((folder: { name: string }) => folder.name).filter(Boolean)); setEvents(eventData.docs || []) }).catch(() => undefined) }, [])
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); const stopLoading = startLoading('Creating gallery…')
    try { await api('/galleries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, event: data.source === 'platform' ? data.event : null, published: true }) }); router.replace('/admin/galleries') } catch (err) { setError(err instanceof Error ? err.message : 'Could not create gallery.') } finally { setSaving(false); stopLoading() }
  }
  function toggleImage(id: string) { setData((current) => ({ ...current, images: current.images.includes(id) ? current.images.filter((item) => item !== id) : [...current.images, id] })) }
  const visibleMedia = media.filter((image) => pickerFolder === '__unsorted__' ? !image.folder : image.folder === pickerFolder)
  const visibleIds = visibleMedia.map((image) => image.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => data.images.includes(id))
  function toggleFolderImages() { setData((current) => ({ ...current, images: allVisibleSelected ? current.images.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current.images, ...visibleIds])) })) }
  const folderCards = [{ id: '__unsorted__', name: 'Unsorted' }, ...folders.map((folder) => ({ id: folder, name: folder }))]
  const field = (name: 'title' | 'date' | 'location' | 'excerpt', label: string, required = false) => <label className="admin-form"><span>{label}{required ? ' *' : ' (optional)'}</span><input required={required} value={data[name]} onChange={(event) => setData((current) => ({ ...current, [name]: event.target.value }))} /></label>
  return <form className="admin-form admin-gallery-form" onSubmit={save}><div className="admin-page-heading"><div><p className="admin-eyebrow">WEBSITE</p><h1>Create gallery</h1><p className="admin-muted">Create a photo archive for a past fashion show.</p></div><button className="admin-primary" disabled={saving || !data.images.length}>{saving ? 'Creating…' : 'Create gallery'}</button></div>{error ? <p className="admin-error">{error}</p> : null}<div className="admin-gallery-details">{field('title', 'Gallery title', true)}<label className="admin-form"><span>Gallery type *</span><select required value={data.source} onChange={(event) => setData((current) => ({ ...current, source: event.target.value, event: event.target.value === 'platform' ? current.event : '' }))}><option value="standalone">Standalone past show</option><option value="platform">Linked to a platform event</option></select></label>{data.source === 'platform' ? <label className="admin-form"><span>Link to past event (optional)</span><select value={data.event} onChange={(event) => setData((current) => ({ ...current, event: event.target.value }))}><option value="">No linked event</option>{events.map((event) => <option value={event.id} key={event.id}>{String(event.title || event.id)}{event.date ? ` — ${new Date(String(event.date)).toLocaleDateString()}` : ''}</option>)}</select>{events.length === 0 ? <small className="admin-muted">No events are available yet.</small> : null}</label> : null}{field('date', 'Show date')}{field('location', 'Location')}{field('excerpt', 'Short blurb')}</div><MediaChoice label="Cover image (optional)" value={data.coverImage} media={media} onChange={(value) => setData((current) => ({ ...current, coverImage: value }))} /><section className="admin-gallery-picker"><div className="admin-gallery-picker__heading"><div><h2>Gallery photos</h2><p className="admin-muted">Choose images from one folder. Selected: {data.images.length}</p></div>{pickerFolder ? <div className="admin-gallery-picker__actions"><button type="button" className="admin-secondary" onClick={toggleFolderImages}>{allVisibleSelected ? 'Clear folder selection' : `Select all ${visibleMedia.length} images`}</button><button type="button" className="admin-secondary" onClick={() => setPickerFolder('')}>← Back to folders</button></div> : null}</div>{pickerFolder === '' ? <div className="admin-picker-folders">{folderCards.map((folder) => <button type="button" className="admin-picker-folder" key={folder.id} onClick={() => setPickerFolder(folder.id)}><FolderOpen size={20} /><strong>{folder.name}</strong><small>{media.filter((image) => folder.id === '__unsorted__' ? !image.folder : image.folder === folder.id).length} images</small></button>)}</div> : visibleMedia.length ? <div className="admin-destination-picker__grid">{visibleMedia.map((image) => { const selected = data.images.includes(image.id); return <label className={`admin-destination-image ${selected ? 'is-selected' : ''}`} key={image.id}><input type="checkbox" checked={selected} onChange={() => toggleImage(image.id)} /><span className="admin-destination-image__preview">{image.url ? <img src={String(image.url)} alt={String(image.filename || '')} /> : null}</span><small>{String(image.filename || image.id)}</small></label> })}</div> : <p className="admin-muted">No images in this folder yet.</p>}</section><div className="admin-form-actions"><button className="admin-primary" disabled={saving || !data.images.length}>{saving ? 'Creating…' : 'Create gallery'}</button></div></form>
}

type PressReleaseFormData = {
  title: string
  designerName: string
  brandName: string
  event: string
  excerpt: string
  body: string
  bodyHtml: string
  websiteUrl: string
  instagramUrl: string
  portraitImage: string
  images: string[]
  publishDate: string
  featured: boolean
  published: boolean
}

function lexicalText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const item = node as { text?: string; type?: string; children?: unknown[] }
    if (item.type === 'text') return item.text || ''
    const content = (item.children || []).map(walk).join('')
    return item.type === 'paragraph' || item.type === 'heading' ? `${content}\n\n` : content
  }
  return walk(value).trim()
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function lexicalHtml(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const render = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const item = node as { type?: string; text?: string; format?: number; tag?: string; url?: string; fields?: { url?: string }; listType?: string; children?: unknown[] }
    if (item.type === 'text') {
      let content = escapeHtml(item.text || '')
      const format = typeof item.format === 'number' ? item.format : 0
      if (format & 1) content = `<strong>${content}</strong>`
      if (format & 2) content = `<em>${content}</em>`
      if (format & 4) content = `<s>${content}</s>`
      if (format & 8) content = `<u>${content}</u>`
      if (format & 16) content = `<code>${content}</code>`
      return content
    }
    const children = (item.children || []).map(render).join('')
    if (item.type === 'linebreak') return '<br />'
    if (item.type === 'paragraph') return `<p>${children || '<br />'}</p>`
    if (item.type === 'heading') return `<${['h1', 'h2', 'h3', 'h4'].includes(item.tag || '') ? item.tag : 'h2'}>${children}</${['h1', 'h2', 'h3', 'h4'].includes(item.tag || '') ? item.tag : 'h2'}>`
    if (item.type === 'list') return `<${item.listType === 'number' ? 'ol' : 'ul'}>${children}</${item.listType === 'number' ? 'ol' : 'ul'}>`
    if (item.type === 'listitem') return `<li>${children}</li>`
    if (item.type === 'quote') return `<blockquote>${children}</blockquote>`
    if (item.type === 'link') { const fields = item.fields as { url?: string } | undefined; return `<a href="${escapeHtml(item.url || fields?.url || '')}">${children}</a>` }
    return children
  }
  const root = value as { root?: { children?: unknown[] } }
  return (root.root?.children || []).map(render).join('')
}

function htmlToLexical(html: string) {
  const template = document.createElement('template')
  template.innerHTML = html
  const parseInline = (node: Node, format = 0): Record<string, unknown>[] => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ? [{ type: 'text', version: 1, detail: 0, format, mode: 'normal', style: '', text: node.textContent }] : []
    if (!(node instanceof HTMLElement)) return node.nodeName.toLowerCase() === 'br' ? [{ type: 'linebreak', version: 1 }] : []
    const tag = node.tagName.toLowerCase()
    const nextFormat = format | (tag === 'strong' || tag === 'b' ? 1 : 0) | (tag === 'em' || tag === 'i' ? 2 : 0) | (tag === 's' || tag === 'del' ? 4 : 0) | (tag === 'u' ? 8 : 0) | (tag === 'code' ? 16 : 0)
    if (tag === 'a') { const url = node.getAttribute('href') || ''; return [{ type: 'link', version: 2, url, fields: { url, newTab: true }, children: Array.from(node.childNodes).flatMap((child) => parseInline(child, nextFormat)) }] }
    return Array.from(node.childNodes).flatMap((child) => parseInline(child, nextFormat))
  }
  const parseBlock = (node: Node): Record<string, unknown>[] => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() ? [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: parseInline(node) }] : []
    if (!(node instanceof HTMLElement)) return []
    const tag = node.tagName.toLowerCase()
    const children = Array.from(node.childNodes).flatMap((child) => parseInline(child))
    if (tag === 'p' || tag === 'div') return [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children }]
    if (/^h[1-4]$/.test(tag)) return [{ type: 'heading', version: 1, tag, direction: 'ltr', format: '', indent: 0, children }]
    if (tag === 'blockquote') return [{ type: 'quote', version: 1, direction: 'ltr', format: '', indent: 0, children }]
    if (tag === 'ul' || tag === 'ol') return [{ type: 'list', version: 1, listType: tag === 'ol' ? 'number' : 'bullet', start: 1, tag: 'ul', direction: 'ltr', format: '', indent: 0, children: Array.from(node.children).flatMap((child) => parseBlock(child)) }]
    if (tag === 'li') return [{ type: 'listitem', version: 1, value: 1, direction: 'ltr', format: '', indent: 0, children }]
    return children.length ? [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children }] : []
  }
  const children = Array.from(template.content.childNodes).flatMap(parseBlock)
  return { root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children } }
}

function pressBody(value: string, html?: string) {
  if (html && typeof document !== 'undefined') return htmlToLexical(html)
  return {
    root: {
      type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
      children: value.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).map((paragraph) => ({
        type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
        children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: paragraph.trim() }],
      })),
    },
  }
}

function PressRichTextEditor({ value, onChange }: { value: string; onChange: (html: string, text: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeFormat, setActiveFormat] = useState('')
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value
  }, [value])
  function command(commandName: string, commandValue?: string, activeKey = commandName) {
    editorRef.current?.focus()
    document.execCommand(commandName, false, commandValue)
    const html = editorRef.current?.innerHTML || ''
    onChange(html, lexicalText(htmlToLexical(html)))
    setActiveFormat(activeKey)
  }
  return <div className="admin-rich-text-editor">
    <div className="admin-rich-text-editor__toolbar" role="toolbar" aria-label="Formatting tools">
      <button type="button" className={activeFormat === 'bold' ? 'is-active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => command('bold')} aria-label="Bold" aria-pressed={activeFormat === 'bold'}>B</button>
      <button type="button" className={activeFormat === 'italic' ? 'is-active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => command('italic')} aria-label="Italic" aria-pressed={activeFormat === 'italic'}><em>I</em></button>
      <button type="button" className={activeFormat === 'heading' ? 'is-active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => command('formatBlock', 'h2', 'heading')} aria-label="Heading" aria-pressed={activeFormat === 'heading'}>H</button>
      <button type="button" className={activeFormat === 'insertUnorderedList' ? 'is-active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => command('insertUnorderedList')} aria-label="Bulleted list" aria-pressed={activeFormat === 'insertUnorderedList'}>•</button>
      <button type="button" className={activeFormat === 'paragraph' ? 'is-active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => command('formatBlock', 'p', 'paragraph')} aria-label="Paragraph" aria-pressed={activeFormat === 'paragraph'}>¶</button>
    </div>
    <div ref={editorRef} className="admin-rich-text-editor__input" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Designer write-up" onInput={(event) => { const html = event.currentTarget.innerHTML; onChange(html, lexicalText(htmlToLexical(html))) }} />
    <p className="admin-rich-text-editor__hint">Use the formatting buttons to structure the story. Links can be pasted into the editor.</p>
  </div>
}

function pressMediaPagePath(page: number) {
  const query = new URLSearchParams({
    limit: '24',
    page: String(page),
    sort: '-createdAt',
    'select[filename]': 'true',
    'select[url]': 'true',
    'select[prefix]': 'true',
    'select[folder]': 'true',
    'select[sizes]': 'true',
  })
  return `/media?${query}`
}

function PressReleaseForm({ id }: { id?: string }) {
  const router = useRouter()
  const { startLoading } = useAdminLoader()
  const [data, setData] = useState<PressReleaseFormData>({ title: '', designerName: '', brandName: '', event: '', excerpt: '', body: '', bodyHtml: '<p><br /></p>', websiteUrl: '', instagramUrl: '', portraitImage: '', images: [], publishDate: localDateTime(new Date().toISOString()), featured: false, published: false })
  const [media, setMedia] = useState<Doc[]>([])
  const [mediaPage, setMediaPage] = useState(1)
  const [mediaTotalPages, setMediaTotalPages] = useState(1)
  const [mediaTotalDocs, setMediaTotalDocs] = useState(0)
  const [mediaRenderLimit, setMediaRenderLimit] = useState(48)
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false)
  const [mediaFolders, setMediaFolders] = useState<string[]>([])
  const [events, setEvents] = useState<Doc[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const initialDataRef = useRef<string | null>(null)
  const allowNavigationRef = useRef(false)
  const historyIndexRef = useRef(0)
  const restoringHistoryRef = useRef(false)
  useEffect(() => {
    const serialized = JSON.stringify(data)
    if (initialDataRef.current === null) {
      initialDataRef.current = serialized
      return
    }
    setDirty(serialized !== initialDataRef.current)
  }, [data])
  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    const confirmNavigation = (event: MouseEvent) => {
      if (allowNavigationRef.current) return
      const target = event.target instanceof Element ? event.target.closest('a') : null
      const href = target?.getAttribute('href')
      if (!target || !href || href.startsWith('#') || target.getAttribute('target') === '_blank') return
      if (!window.confirm('Discard your unsaved press release changes?')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const historyKey = '__pressReleaseHistoryIndex'
    const currentState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
    const currentIndex = typeof (currentState as Record<string, unknown>)[historyKey] === 'number'
      ? Number((currentState as Record<string, unknown>)[historyKey])
      : 0
    historyIndexRef.current = currentIndex
    if (typeof (currentState as Record<string, unknown>)[historyKey] !== 'number') {
      window.history.replaceState({ ...currentState, [historyKey]: currentIndex }, '', window.location.href)
    }
    const confirmHistoryNavigation = (event: PopStateEvent) => {
      const nextState = event.state && typeof event.state === 'object' ? event.state as Record<string, unknown> : {}
      const nextIndex = typeof nextState[historyKey] === 'number' ? Number(nextState[historyKey]) : historyIndexRef.current - 1
      if (restoringHistoryRef.current) {
        restoringHistoryRef.current = false
        historyIndexRef.current = nextIndex
        return
      }
      if (allowNavigationRef.current || window.confirm('Discard your unsaved press release changes?')) {
        historyIndexRef.current = nextIndex
        return
      }
      const delta = historyIndexRef.current - nextIndex
      if (delta) {
        restoringHistoryRef.current = true
        window.history.go(delta)
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', confirmNavigation, true)
    window.addEventListener('popstate', confirmHistoryNavigation)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', confirmNavigation, true)
      window.removeEventListener('popstate', confirmHistoryNavigation)
    }
  }, [dirty])
  useEffect(() => {
    let active = true
    const stopLoading = startLoading(id ? 'Loading press release…' : 'Loading press studio…')
    void Promise.all([api(pressMediaPagePath(1)), api('/globals/media-folders').catch(() => ({ folders: [] })), api('/events?limit=200&sort=-date').catch(() => ({ docs: [] })), id ? api(`/press-releases/${id}?depth=2`) : Promise.resolve(null)])
      .then(([mediaData, folderData, eventData, release]) => {
        if (!active) return
        const pageDocs: Doc[] = (mediaData.docs || []).map(withAdminPreviewUrl)
        const selectedDocs: Doc[] = release
          ? [release.portraitImage, ...(Array.isArray(release.images) ? release.images : [])]
              .filter((item): item is Doc => Boolean(item && typeof item === 'object' && 'id' in item))
              .map(withAdminPreviewUrl)
          : []
        setMedia(Array.from(new Map([...pageDocs, ...selectedDocs].map((item) => [item.id, item])).values()))
        setMediaPage(Number(mediaData.page || 1))
        setMediaTotalPages(Number(mediaData.totalPages || 1))
        setMediaTotalDocs(Number(mediaData.totalDocs || pageDocs.length))
        setMediaFolders((folderData.folders || []).map((folder: { name?: unknown }) => String(folder.name || '')).filter(Boolean))
        setEvents(eventData.docs || [])
        if (release) {
          const nextData: PressReleaseFormData = { title: String(release.title || ''), designerName: String(release.designerName || ''), brandName: String(release.brandName || ''), event: relationId(release.event), excerpt: String(release.excerpt || ''), body: lexicalText(release.body), bodyHtml: lexicalHtml(release.body), websiteUrl: String(release.websiteUrl || ''), instagramUrl: String(release.instagramUrl || ''), portraitImage: relationId(release.portraitImage), images: Array.isArray(release.images) ? release.images.map(relationId).filter(Boolean) : [], publishDate: localDateTime(release.publishDate), featured: Boolean(release.featured), published: Boolean(release.published) }
          initialDataRef.current = JSON.stringify(nextData)
          setDirty(false)
          setData(nextData)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load press release.'))
      .finally(stopLoading)
    return () => { active = false }
  }, [id, startLoading])
  async function save(event: React.FormEvent) {
    event.preventDefault()
    const selectedMedia = [data.portraitImage, ...data.images].map((mediaID) => media.find((item) => item.id === mediaID))
    if (selectedMedia.some((item) => !isPrivatePressMedia(item))) {
      setError('Press releases can only use private AWS media. Replace any legacy image before saving.')
      return
    }
    setSaving(true); setError(''); const stopLoading = startLoading(id ? 'Saving press release…' : 'Publishing press release…')
    try {
      const { bodyHtml, ...payload } = data
      await api(id ? `/press-releases/${id}` : '/press-releases', { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, publishDate: data.publishDate ? new Date(data.publishDate).toISOString() : undefined, body: pressBody(data.body, bodyHtml) }) })
      allowNavigationRef.current = true
      router.replace('/admin/press-releases')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save press release.') } finally { setSaving(false); stopLoading() }
  }
  async function loadMoreMedia() {
    if (loadingMoreMedia || mediaPage >= mediaTotalPages) return
    setLoadingMoreMedia(true)
    try {
      const nextPage = mediaPage + 1
      const response = await api(pressMediaPagePath(nextPage))
      const nextDocs: Doc[] = (response.docs || []).map(withAdminPreviewUrl)
      setMedia((current) => Array.from(new Map([...current, ...nextDocs].map((item) => [item.id, item])).values()))
      setMediaPage(Number(response.page || nextPage))
      setMediaTotalPages(Number(response.totalPages || mediaTotalPages))
      setMediaTotalDocs(Number(response.totalDocs || mediaTotalDocs))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more images.')
    } finally {
      setLoadingMoreMedia(false)
    }
  }
  function toggleImage(imageId: string) { setData((current) => ({ ...current, images: current.images.includes(imageId) ? current.images.filter((item) => item !== imageId) : [...current.images, imageId] })) }
  const privateMedia = media.filter((item) => isPrivatePressMedia(item))
  const selectedMediaIDs = new Set([data.portraitImage, ...data.images].filter(Boolean))
  const renderedPrivateMedia = Array.from(new Map([
    ...privateMedia.slice(0, mediaRenderLimit),
    ...privateMedia.filter((item) => selectedMediaIDs.has(item.id)),
  ].map((item) => [item.id, item])).values())
  const hasLegacySelection = [data.portraitImage, ...data.images]
    .filter(Boolean)
    .some((mediaID) => !isPrivatePressMedia(media.find((item) => item.id === mediaID)))
  const field = (name: keyof PressReleaseFormData, label: string, type = 'text', required = false) => <label className="admin-form"><span>{label}{required ? ' *' : ''}</span><input type={type} required={required} value={String(data[name])} onChange={(event) => setData((current) => ({ ...current, [name]: event.target.value }))} /></label>
  return <form className="admin-form admin-press-form" onSubmit={save}>
    <div className="admin-page-heading"><div><p className="admin-eyebrow">EDITORIAL</p><h1>{id ? 'Edit press release' : 'New press release'}</h1><p className="admin-muted">Build a polished designer profile with the story, images, and show connection ready for publication.</p></div><div className="admin-page-heading__actions"><Link href="/admin/press-releases" className="admin-secondary">Cancel</Link><button className="admin-primary" disabled={saving || !data.portraitImage || !data.body || hasLegacySelection}>{saving ? 'Saving…' : data.published ? 'Publish profile' : 'Save draft'}</button></div></div>
    {error ? <p className="admin-error" role="alert">{error}</p> : null}
    {hasLegacySelection ? <p className="admin-error" role="alert">This profile still references legacy external media. Replace those images before saving.</p> : null}
    <div className="admin-press-form__grid"><div className="admin-press-form__main">{field('title', 'Press headline', 'text', true)}{field('designerName', 'Designer name', 'text', true)}{field('brandName', 'Brand / label name')}{field('excerpt', 'Short introduction', 'text', true)}<label className="admin-form"><span>Designer write-up *</span><PressRichTextEditor value={data.bodyHtml} onChange={(bodyHtml, body) => setData((current) => ({ ...current, bodyHtml, body }))} /><input className="admin-rich-text-editor__required" required value={data.body} onChange={() => undefined} aria-label="Designer write-up" tabIndex={-1} /></label></div><div className="admin-press-form__side"><label className="admin-form"><span>Participating show</span><select value={data.event} onChange={(event) => setData((current) => ({ ...current, event: event.target.value }))}><option value="">No linked show</option>{events.map((item) => <option key={item.id} value={item.id}>{String(item.title || item.id)}</option>)}</select></label>{field('publishDate', 'Publish date', 'datetime-local')}{field('websiteUrl', 'Website URL', 'url')}{field('instagramUrl', 'Instagram URL', 'url')}<MediaChoice label="Designer portrait / hero image" required value={data.portraitImage} media={privateMedia} folderNames={mediaFolders} selectedMedia={media.find((item) => item.id === data.portraitImage)} onChange={(value) => setData((current) => ({ ...current, portraitImage: value }))} onLoadMore={loadMoreMedia} hasMore={mediaPage < mediaTotalPages} loadingMore={loadingMoreMedia} /><label className="admin-form admin-check-row"><input type="checkbox" checked={data.featured} onChange={(event) => setData((current) => ({ ...current, featured: event.target.checked }))} /><span>Feature this profile on the press page</span></label><label className="admin-form admin-check-row"><input type="checkbox" checked={data.published} onChange={(event) => setData((current) => ({ ...current, published: event.target.checked }))} /><span>Publish immediately</span></label></div></div>
    <section className="admin-press-images">
      <div><h2>Collection and studio images</h2><p className="admin-muted">Select additional images to show below the write-up. Selected: {data.images.length}</p></div>
      <div className="admin-destination-picker__grid">{renderedPrivateMedia.map((image) => { const selected = data.images.includes(image.id); return <label className={`admin-destination-image ${selected ? 'is-selected' : ''}`} key={image.id}><input type="checkbox" checked={selected} onChange={() => toggleImage(image.id)} aria-label={`Select ${String(image.filename || 'image')}`} /><span className="admin-destination-image__preview">{image.url ? <img src={String(image.url)} alt={String(image.filename || '')} loading="lazy" decoding="async" /> : null}</span><small>{String(image.filename || image.id)}</small></label> })}</div>
      <div className="admin-media-pagination"><span aria-live="polite">Showing {renderedPrivateMedia.length} of {privateMedia.length} loaded private AWS images ({media.length} checked)</span><div className="admin-media-pagination__actions">{privateMedia.length > mediaRenderLimit ? <button type="button" className="admin-secondary" onClick={() => setMediaRenderLimit((current) => current + 48)}>Show more loaded</button> : null}{mediaPage < mediaTotalPages ? <button type="button" className="admin-secondary" disabled={loadingMoreMedia} onClick={() => void loadMoreMedia()}>{loadingMoreMedia ? 'Loading…' : 'Load 24 more'}</button> : null}</div></div>
      {mediaPage >= mediaTotalPages && mediaTotalDocs > 0 ? <p className="admin-media-pagination__complete">Checked all {mediaTotalDocs} media records; {privateMedia.length} are ready for Press.</p> : null}
    </section>
    <div className="admin-form-actions"><button className="admin-primary" disabled={saving || !data.portraitImage || !data.body || hasLegacySelection}>{saving ? 'Saving…' : data.published ? 'Publish profile' : 'Save draft'}</button></div>
  </form>
}

function MediaChoice({ label, value, media, folderNames: configuredFolderNames = [], onChange, required = false, selectedMedia, onLoadMore, hasMore = false, loadingMore = false }: { label: string; value: string; media: Doc[]; folderNames?: string[]; onChange: (value: string) => void; required?: boolean; selectedMedia?: Doc; onLoadMore?: () => Promise<void>; hasMore?: boolean; loadingMore?: boolean }) {
  const [open, setOpen] = useState(false)
  const [folder, setFolder] = useState('')
  const [displayLimit, setDisplayLimit] = useState(24)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const selected = selectedMedia || media.find((image) => image.id === value)
  const folderNames = Array.from(new Set([...configuredFolderNames, ...media.map((image) => String(image.folder || ''))].filter((name) => Boolean(name) && name !== '__unsorted__'))).sort((a, b) => a.localeCompare(b))
  const folderCards = [{ id: '__unsorted__', name: 'Unsorted' }, ...folderNames.map((name) => ({ id: name, name }))]
  const visibleMedia = media.filter((image) => folder === '__unsorted__' ? !image.folder || image.folder === '__unsorted__' : image.folder === folder)
  const renderedMedia = Array.from(new Map([
    ...visibleMedia.slice(0, displayLimit),
    ...visibleMedia.filter((image) => image.id === value),
  ].map((image) => [image.id, image])).values())
  useEffect(() => {
    if (!open) return
    const previousActive = document.activeElement as HTMLElement | null
    const trigger = triggerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusPanel = () => panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()
    const closeOnEscapeOrTrapFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); setFolder(''); return }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', closeOnEscapeOrTrapFocus)
    const focusTimer = window.setTimeout(focusPanel, 0)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscapeOrTrapFocus)
      window.setTimeout(() => (trigger || previousActive)?.focus(), 0)
    }
  }, [open])
  function closePicker() { setOpen(false); setFolder(''); setDisplayLimit(24) }
  function chooseFolder(nextFolder: string) { setFolder(nextFolder); setDisplayLimit(24) }
  function chooseImage(id: string) { onChange(id); closePicker() }
  return <div className="admin-form admin-media-choice"><span>{label}{required ? ' *' : ''}</span><div className={`admin-media-choice__control ${selected ? 'has-selection' : ''}`}>{selected ? <><div className="admin-media-choice__selected-image">{selected.url ? <img src={String(selected.url)} alt={String(selected.filename || '')} loading="lazy" decoding="async" /> : null}</div><div className="admin-media-choice__selected-copy"><strong>{String(selected.filename || selected.id)}</strong><small>{String(selected.folder && selected.folder !== '__unsorted__' ? selected.folder : 'Unsorted')}</small></div></> : <><span className="admin-media-choice__empty-icon"><Images size={21} /></span><div className="admin-media-choice__selected-copy"><strong>No image selected</strong><small>Choose from the media library</small></div></>}<div className="admin-media-choice__control-actions"><button ref={triggerRef} type="button" className="admin-secondary" onClick={() => setOpen(true)}>{selected ? 'Change image' : 'Choose image'}</button>{selected && !required ? <button type="button" className="admin-media-choice__remove" onClick={() => onChange('')}>Remove</button> : null}</div></div>{open ? <div className="admin-media-modal" role="dialog" aria-modal="true" aria-label={`${label} picker`}><button type="button" className="admin-media-modal__backdrop" aria-label="Close image picker" onClick={closePicker} /><section ref={panelRef} className="admin-media-modal__panel"><header className="admin-media-modal__header"><div><p className="admin-eyebrow">MEDIA LIBRARY</p><h2>{label}</h2><p className="admin-muted">{folder ? `Choose one image from ${folder === '__unsorted__' ? 'Unsorted' : folder}.` : 'Choose a folder to browse its images.'}</p></div><button type="button" className="admin-icon-button admin-media-modal__close" onClick={closePicker} aria-label="Close image picker"><X size={22} /></button></header><div className="admin-media-modal__body">{folder ? <div className="admin-media-choice__toolbar"><button type="button" className="admin-secondary" onClick={() => chooseFolder('')}>← Back to folders</button><small>{visibleMedia.length ? `${renderedMedia.length} of ${visibleMedia.length} images shown` : 'Images available; load more to browse them.'}</small></div> : null}{folder === '' ? <div className="admin-picker-folders">{folderCards.map((item) => <button type="button" className="admin-picker-folder" key={item.id} onClick={() => chooseFolder(item.id)}><FolderOpen size={20} /><strong>{item.name}</strong><small>{media.filter((image) => item.id === '__unsorted__' ? !image.folder || image.folder === '__unsorted__' : image.folder === item.id).length || 'Images available'}</small></button>)}</div> : visibleMedia.length ? <div className="admin-destination-picker__grid">{renderedMedia.map((image) => <button type="button" className={`admin-destination-image ${image.id === value ? 'is-selected' : ''}`} key={image.id} onClick={() => chooseImage(image.id)}><span className="admin-destination-image__preview">{image.url ? <img src={String(image.url)} alt={String(image.filename || '')} loading="lazy" decoding="async" /> : null}</span><small>{String(image.filename || image.id)}</small></button>)}</div> : <p className="admin-muted">No private AWS images loaded in this folder yet. Use “Load 24 more” to browse it.</p>}{folder && visibleMedia.length > displayLimit ? <div className="admin-media-pagination"><span>More loaded images are hidden for performance.</span><button type="button" className="admin-secondary" onClick={() => setDisplayLimit((current) => current + 24)}>Show more loaded</button></div> : null}{hasMore && onLoadMore ? <div className="admin-media-pagination"><span>More media is available.</span><button type="button" className="admin-secondary" disabled={loadingMore} onClick={() => void onLoadMore()}>{loadingMore ? 'Loading…' : 'Load 24 more'}</button></div> : null}</div></section></div> : null}{required ? <input className="admin-media-choice__required" tabIndex={-1} required value={value} onChange={() => undefined} aria-label={label} /> : null}</div>
}

type DestinationImage = string | { id: string; filename?: string; url?: string }
type Destination = { id?: string; city: string; images?: DestinationImage[] }

function HomeDestinationsPage() {
  const { startLoading } = useAdminLoader()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [media, setMedia] = useState<Doc[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; phase: string; fileName: string } | null>(null)
  const [openGalleryFor, setOpenGalleryFor] = useState<number | null>(null)
  const [galleryFolder, setGalleryFolder] = useState('')
  const [folders, setFolders] = useState<string[]>([])

  const load = useCallback(async () => {
    const stopLoading = startLoading('Loading homepage settings…')
    try {
      const [data, mediaData] = await Promise.all([
        api('/globals/home-destinations?depth=2'),
        api('/media?limit=200&sort=-createdAt'),
      ])
      setDestinations(data.destinations || [])
      setMedia(mediaData.docs || [])
      const folderData = await api('/globals/media-folders').catch(() => ({ folders: [] }))
      setFolders((folderData.folders || []).map((folder: { name: string }) => folder.name).filter(Boolean))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load homepage destinations.')
    } finally {
      stopLoading()
    }
  }, [startLoading])

  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])

  async function save() {
    setSaving(true)
    setMessage('')
    setError('')
    const stopLoading = startLoading('Saving homepage settings…')
    try {
      await api('/globals/home-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations: destinations.map((destination) => ({
            ...destination,
            images: destination.images?.map((image) => typeof image === 'string' ? image : image.id),
          })),
        }),
      })
      setMessage('Homepage destinations saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save homepage destinations.')
    } finally {
      setSaving(false)
      stopLoading()
    }
  }

  function toggleImage(destinationIndex: number, imageId: string) {
    setDestinations((items) => items.map((item, index) => {
      if (index !== destinationIndex) return item
      const images = item.images || []
      const selected = images.some((image) => (typeof image === 'string' ? image : image.id) === imageId)
      return { ...item, images: selected ? images.filter((image) => (typeof image === 'string' ? image : image.id) !== imageId) : [...images, imageId] }
    }))
  }

  async function uploadForDestination(destinationIndex: number, files: FileList | null) {
    if (!files?.length) return
    setError('')
    const selectedFiles = Array.from(files)
    const stopLoading = startLoading('Uploading images…')
    setUploadProgress({ current: 0, total: selectedFiles.length, phase: 'Preparing', fileName: selectedFiles[0].name })
    try {
      const uploadedIds: string[] = []
      for (const [fileIndex, file] of selectedFiles.entries()) {
        setUploadProgress({ current: fileIndex, total: selectedFiles.length, phase: 'Compressing', fileName: file.name })
        const uploadedFile = await compressImage(file)
        setUploadProgress({ current: fileIndex + 1, total: selectedFiles.length, phase: 'Uploading', fileName: uploadedFile.name })
        const uploaded = await api('/media', { method: 'POST', body: (() => { const form = new FormData(); form.append('file', uploadedFile); return form })() })
        const doc = uploaded.doc || uploaded
        if (doc?.id) {
          uploadedIds.push(doc.id)
          setMedia((items) => [doc, ...items.filter((item) => item.id !== doc.id)])
        }
      }
      if (uploadedIds.length) setDestinations((items) => items.map((item, index) => index === destinationIndex ? { ...item, images: [...(item.images || []), ...uploadedIds] } : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload images.')
    } finally {
      setUploadProgress(null)
      stopLoading()
    }
  }

  return <>
    <div className="admin-page-heading"><div><p className="admin-eyebrow">WEBSITE</p><h1>Homepage city snaps</h1><p className="admin-muted">Edit the city labels and review the rotating photos used on the homepage.</p></div><button className="admin-primary" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    {error ? <p className="admin-error">{error}</p> : null}
    {message ? <p className="admin-muted">{message}</p> : null}
    <div className="admin-destination-grid">{destinations.map((destination, index) => <div className="admin-welcome" key={destination.id || index}>
      <label className="admin-form"><span>City name</span><input value={destination.city || ''} onChange={(event) => setDestinations((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, city: event.target.value } : item))} /></label>
      <p className="admin-muted">{destination.images?.length || 0} rotating photo{destination.images?.length === 1 ? '' : 's'} attached.</p>
      <div className="admin-destination-picker"><div className="admin-destination-picker__header"><strong>Select photos</strong><div className="admin-destination-picker__actions"><label className="admin-secondary admin-upload-button">Upload new image<input type="file" accept="image/*" multiple disabled={Boolean(uploadProgress)} onChange={(event) => { void uploadForDestination(index, event.target.files); event.currentTarget.value = '' }} /></label><button type="button" className="admin-secondary" onClick={() => { setOpenGalleryFor((current) => current === index ? null : index); setGalleryFolder('') }}>{openGalleryFor === index ? 'Hide gallery' : 'Choose from gallery'}</button></div></div>{uploadProgress ? <UploadProgress progress={uploadProgress} /> : null}{openGalleryFor === index ? (galleryFolder === '' ? <div className="admin-picker-folders">{[{ name: 'Unsorted', id: '__unsorted__' }, ...folders.map((folder) => ({ name: folder, id: folder }))].map((folder) => <button type="button" className="admin-picker-folder" key={folder.id} onClick={() => setGalleryFolder(folder.id)}><FolderOpen size={20} /><strong>{folder.name}</strong><small>{media.filter((image) => folder.id === '__unsorted__' ? !image.folder : image.folder === folder.id).length} images</small></button>)}</div> : <><button type="button" className="admin-secondary admin-picker-back" onClick={() => setGalleryFolder('')}>← Back to folders</button>{media.filter((image) => galleryFolder === '__unsorted__' ? !image.folder : image.folder === galleryFolder).length ? <div className="admin-destination-picker__grid">{media.filter((image) => galleryFolder === '__unsorted__' ? !image.folder : image.folder === galleryFolder).map((image) => { const selected = destination.images?.some((item) => (typeof item === 'string' ? item : item.id) === image.id) || false; return <label className={`admin-destination-image ${selected ? 'is-selected' : ''}`} key={image.id}><input type="checkbox" checked={selected} onChange={() => toggleImage(index, image.id)} /><span className="admin-destination-image__preview">{image.url ? <img src={String(image.url)} alt={String(image.filename || '')} /> : null}</span><small>{String(image.filename || image.id)}</small></label> })}</div> : <p className="admin-muted">No images in this folder yet.</p>}</>) : null}</div>
    </div>)}</div>
  </>
}

function UploadProgress({ progress }: { progress: { current: number; total: number; phase: string; fileName: string } }) {
  const percentage = Math.round((progress.current / progress.total) * 100)
  return <div className="admin-upload-progress" role="status"><div><strong>{progress.phase} {progress.current} of {progress.total}</strong><span>{percentage}%</span></div><div className="admin-upload-progress__track"><span style={{ width: `${Math.max(4, percentage)}%` }} /></div><small>{progress.fileName}</small></div>
}

function MediaPage() {
  const { startLoading } = useAdminLoader()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState<ListResponse | null>(null)
  const [allMedia, setAllMedia] = useState<Doc[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; phase: string; fileName: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState('')
  const load = useCallback(async () => { const stopLoading = startLoading('Loading media library…'); try { const [mediaData, folderData] = await Promise.all([api('/media?limit=200&sort=-createdAt'), api('/globals/media-folders').catch(() => ({ folders: [] }))]); const docs = mediaData.docs || []; setAllMedia(docs); setMedia({ ...mediaData, docs: selectedFolder ? docs.filter((doc: Doc) => selectedFolder === '__unsorted__' ? !doc.folder : doc.folder === selectedFolder) : [] }); setFolders((folderData.folders || []).map((folder: { name: string }) => folder.name).filter(Boolean)) } finally { stopLoading() } }, [selectedFolder, startLoading])
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch(() => setMedia(null)) }, 0); return () => window.clearTimeout(timer) }, [load])
  async function createFolder() { const name = window.prompt('New folder name'); const normalized = name?.trim(); if (!normalized || folders.includes(normalized)) return; const stopLoading = startLoading('Creating folder…'); try { await api('/globals/media-folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folders: [...folders.map((item) => ({ name: item })), { name: normalized }] }) }); setFolders((items) => [...items, normalized]); setSelectedFolder(normalized); setMessage(`Folder “${normalized}” created.`) } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not create folder.') } finally { stopLoading() } }
  async function renameFolder(oldName: string) { const name = window.prompt('Rename folder', oldName); const normalized = name?.trim(); if (!normalized || normalized === oldName || folders.includes(normalized)) return; const stopLoading = startLoading('Renaming folder…'); try { await api('/globals/media-folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folders: folders.map((item) => ({ name: item === oldName ? normalized : item })) }) }); const affected = allMedia.filter((doc) => doc.folder === oldName); await Promise.all(affected.map((doc) => api(`/media/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: normalized }) }))); setFolders((items) => items.map((item) => item === oldName ? normalized : item)); setAllMedia((items) => items.map((doc) => doc.folder === oldName ? { ...doc, folder: normalized } : doc)); if (selectedFolder === oldName) setSelectedFolder(normalized); setMessage(`Folder renamed to “${normalized}”.`) } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not rename folder.') } finally { stopLoading() } }
  async function upload() { if (!files.length) return; setUploading(true); setMessage(''); const stopLoading = startLoading('Uploading images…'); let completed = 0; const selectedFiles = [...files]; setUploadProgress({ current: 0, total: selectedFiles.length, phase: 'Preparing', fileName: selectedFiles[0].name }); try { for (const [fileIndex, file] of selectedFiles.entries()) { setUploadProgress({ current: fileIndex, total: selectedFiles.length, phase: 'Compressing', fileName: file.name }); const uploadedFile = await compressImage(file); setUploadProgress({ current: fileIndex + 1, total: selectedFiles.length, phase: 'Uploading', fileName: uploadedFile.name }); const body = new FormData(); body.append('file', uploadedFile); if (selectedFolder) body.append('_payload', JSON.stringify({ folder: selectedFolder })); await api('/media', { method: 'POST', body }); completed += 1; } setFiles([]); setMessage(`${completed} file${completed === 1 ? '' : 's'} uploaded successfully.`); await load() } catch (err) { setMessage(err instanceof Error ? err.message : 'Upload failed.') } finally { setUploading(false); setUploadProgress(null); stopLoading() } }
  async function removeMedia(doc: Doc) { if (!window.confirm(`Delete ${String(doc.filename || 'this image')} permanently?`)) return; setDeleting(doc.id); const stopLoading = startLoading('Deleting image…'); try { await api(`/media/${doc.id}`, { method: 'DELETE' }); setAllMedia((items) => items.filter((item) => item.id !== doc.id)); setMedia((current) => current ? { ...current, docs: current.docs.filter((item) => item.id !== doc.id), totalDocs: Math.max(0, current.totalDocs - 1) } : current); setMessage('Image deleted.') } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not delete image.') } finally { setDeleting(null); stopLoading() } }
  const folderCards = [{ id: '__unsorted__', name: 'Unsorted', count: allMedia.filter((doc) => !doc.folder).length }, ...folders.map((folder) => ({ id: folder, name: folder, count: allMedia.filter((doc) => doc.folder === folder).length }))]
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">ASSETS</p><h1>Media library</h1><p className="admin-muted">Private S3-backed images shared by events, galleries, and homepage cards.</p></div></div><div className="admin-media-folders"><strong>Folders</strong><button type="button" className="admin-secondary" onClick={() => void createFolder()}>Create folder</button></div><div className="admin-upload"><div><h2>Upload images</h2><p className="admin-muted">{selectedFolder ? `New uploads will be added to “${selectedFolder === '__unsorted__' ? 'Unsorted' : selectedFolder}”.` : 'Open a folder first, then upload images into it.'}</p></div><label className="admin-file-picker"><span>Choose images</span><input type="file" accept="image/*" multiple disabled={uploading || !selectedFolder} onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label><div className="admin-upload__files">{files.length ? files.map((file) => <span key={file.name}>{file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item !== file))}>×</button></span>) : <span className="admin-upload__empty">{selectedFolder ? 'No files selected' : 'Select a folder to upload'}</span>}</div>{uploadProgress ? <UploadProgress progress={uploadProgress} /> : null}<button className="admin-primary" disabled={!files.length || uploading || !selectedFolder} onClick={() => void upload()}>{uploading ? 'Uploading…' : `Upload ${files.length || ''} file${files.length === 1 ? '' : 's'}`}</button>{message ? <p className="admin-muted">{message}</p> : null}</div>{!selectedFolder ? <div className="admin-folder-grid">{folderCards.map((folder) => <div className="admin-folder-card" key={folder.id} role="button" tabIndex={0} onClick={() => setSelectedFolder(folder.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedFolder(folder.id) }}><FolderOpen size={28} /><strong>{folder.name}</strong><small>{folder.count} image{folder.count === 1 ? '' : 's'}</small>{folder.id !== '__unsorted__' ? <button type="button" className="admin-folder-card__rename" onClick={(event) => { event.stopPropagation(); void renameFolder(folder.name) }}><Pencil size={13} /> Rename</button> : null}</div>)}</div> : <><div className="admin-folder-heading"><button type="button" className="admin-secondary" onClick={() => setSelectedFolder('')}>← Back to folders</button><h2>{selectedFolder === '__unsorted__' ? 'Unsorted' : selectedFolder}</h2></div><div className="admin-media-grid">{media?.docs.map((doc) => <div className="admin-media-card" key={doc.id}><div className="admin-media-card__image">{doc.url ? <img loading="lazy" decoding="async" src={String(doc.url)} alt={String(doc.alt || doc.filename || '')} /> : null}</div><strong>{String(doc.filename || doc.id)}</strong><small>{text(doc.filesize)}</small><button type="button" className="admin-danger" disabled={deleting === doc.id} onClick={() => void removeMedia(doc)}>{deleting === doc.id ? 'Deleting…' : 'Delete image'}</button></div>)}</div></>}</>
}

function AdminAppContent({ section }: { section?: string[] }) {
  const [open, setOpen] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const slug = section?.[0]

  useEffect(() => {
    let active = true
    // Verify the existing session before rendering any admin UI. A failed
    // session check must fail closed; otherwise public collections could make
    // an unauthenticated visitor look like they are inside the admin panel.
    api('/users/me')
      .catch(async (error) => {
        if (!(error instanceof Error) || error.message !== 'AUTH_REQUIRED') throw error
        await api('/users/refresh-token', { method: 'POST' })
        return api('/users/me')
      })
      .then((body) => {
        if (!body?.user) throw new Error('AUTH_REQUIRED')
        if (active) setSessionReady(true)
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
          window.location.replace('/login')
          return
        }
        setSessionError(true)
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
      api('/users/refresh-token', { method: 'POST' }).catch((error) => {
        if (error instanceof Error && error.message === 'AUTH_REQUIRED') window.location.replace('/login')
      })
    }, refreshEvery)

    return () => window.clearInterval(timer)
  }, [sessionReady])

  if (sessionError) return <div className="admin-session-loading"><div><p>We couldn’t verify your admin session.</p><button className="admin-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div></div>
  if (!sessionReady) return <div className="admin-session-loading">Checking admin access…</div>

  // Keep the admin shell mounted while the session is refreshed in the
  // background. Route transitions remount this component, and blocking the
  // whole page here made every navigation look like a reload.
  const isNewEvent = slug === 'events' && section?.[1] === 'new'
  const isNewGallery = slug === 'galleries' && section?.[1] === 'new'
  const isNewPressRelease = slug === 'press-releases' && section?.[1] === 'new'
  const recordId = section?.[1] && section[1] !== 'new' ? section[1] : undefined
  return <div className="admin-shell"><Sidebar open={open} close={() => setOpen(false)} /><div className="admin-main"><header className="admin-topbar"><button className="admin-icon-button admin-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div><span className="admin-topbar__crumb">LA Fashion Closet</span>{slug ? <><ChevronRight size={14} /><span>{labels[slug] || slug}</span></> : <><ChevronRight size={14} /><span>Overview</span></>}</div><Link href="/" className="admin-topbar__home">Visit site</Link></header><main className="admin-content">{isNewEvent ? <EventForm /> : recordId && slug === 'events' ? <EventForm id={recordId} /> : isNewGallery ? <GalleryForm /> : isNewPressRelease ? <PressReleaseForm /> : recordId && slug === 'press-releases' ? <PressReleaseForm id={recordId} /> : recordId && slug ? <RecordDetailPage slug={slug} id={recordId} /> : !slug ? <Overview /> : slug === 'media' ? <MediaPage /> : slug === 'home-destinations' ? <HomeDestinationsPage /> : <CollectionPage slug={slug} />}</main></div>{open ? <button className="admin-backdrop" onClick={() => setOpen(false)} aria-label="Close menu" /> : null}</div>
}

export function AdminApp({ section }: { section?: string[] }) {
  return <AdminLoadingProvider><AdminAppContent section={section} /></AdminLoadingProvider>
}

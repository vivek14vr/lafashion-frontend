'use client'

/* eslint-disable @next/next/no-img-element -- Admin previews use short-lived S3/Payload URLs and native lazy loading. */

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BarChart3, CalendarDays, ChevronRight, Download, FolderOpen, Images, LayoutDashboard, LogOut, Menu, Pencil, Users, X } from 'lucide-react'

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
  useEffect(() => { Promise.all(nav.slice(1, 7).map(async (item) => { const slug = item.href.split('/').pop()!; const response = await api(`/${slug}?limit=1`).catch(() => ({ totalDocs: 0 })); return [slug, response.totalDocs] as const })).then((items) => setCounts(Object.fromEntries(items))) }, [])
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">CONTENT STUDIO</p><h1>LA Fashion Closet</h1><p className="admin-muted">A focused workspace for the stories, images, and people behind the site.</p></div><Link href="/" className="admin-secondary">View website <ChevronRight size={16} /></Link></div><div className="admin-stat-grid">{nav.slice(1, 7).map(({ href, label, icon: Icon }) => <Link href={href} className="admin-stat" key={href}><span className="admin-stat__icon"><Icon size={19} /></span><span><strong>{counts[href.split('/').pop()!] ?? '—'}</strong><small>{label}</small></span><ChevronRight size={17} /></Link>)}</div><div className="admin-welcome"><p className="admin-eyebrow">QUICK START</p><h2>Keep the public site alive</h2><p className="admin-muted">Create an event, upload a batch of photos, then assemble those images into a gallery or homepage city card.</p><div className="admin-actions"><Link href="/admin/events/new" className="admin-primary">Create event</Link><Link href="/admin/media" className="admin-secondary">Upload media</Link></div></div></>
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
      params.set('where[or][0][title][contains]', term)
      params.set('where[or][1][email][contains]', term)
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
  }, [isSubmission])
  const load = useCallback(async (searchTerm = '', nextStatus = '', from = '', to = '') => { const stopLoading = startLoading('Loading records…'); try { setError(''); setData(await api(`/${slug}?${buildQuery(searchTerm, nextStatus, from, to)}`)) } catch (err) { if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login'); else setError(err instanceof Error ? err.message : 'Could not load records.') } finally { stopLoading() } }, [buildQuery, router, slug, startLoading])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])
  async function removeEvent(doc: Doc) {
    if (slug !== 'events' || !window.confirm(`Delete “${String(doc.title || 'this event')}” permanently?`)) return
    setDeleting(doc.id)
    const stopLoading = startLoading('Deleting event…')
    try {
      await api(`/events/${doc.id}`, { method: 'DELETE' })
      setData((current) => current ? { ...current, docs: current.docs.filter((item) => item.id !== doc.id), totalDocs: Math.max(0, current.totalDocs - 1) } : current)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') router.replace('/login')
      else setError(err instanceof Error ? err.message : 'Could not delete event.')
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
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">WEBSITE</p><h1>{title}</h1><p className="admin-muted">{readOnly ? 'Review submissions and move each applicant through your workflow.' : 'Manage the content shown across the public website.'}</p></div>{!readOnly && <Link href={`/admin/${slug}/new`} className="admin-primary">Create new</Link>}</div><div className="admin-toolbar"><label className="sr-only" htmlFor="admin-record-search">Search records</label><input id="admin-record-search" placeholder="Search by title or email" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load(query, statusFilter, dateFrom, dateTo)} />{isSubmission ? <><label className="sr-only" htmlFor="admin-status-filter">Filter by submission status</label><select id="admin-status-filter" className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><label className="admin-date-filter">From<input aria-label="Submitted from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label><label className="admin-date-filter">To<input aria-label="Submitted to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} /></label></> : null}<button type="button" className="admin-secondary" onClick={() => void load(query, statusFilter, dateFrom, dateTo)}>Apply filters</button>{isSubmission ? <button type="button" className="admin-secondary admin-download" disabled={exporting} onClick={() => void downloadCsv()}><Download size={16} />{exporting ? 'Preparing…' : 'Download CSV'}</button> : null}</div>{error ? <p className="admin-error" role="alert">{error}</p> : null}<div className="admin-table-meta"><strong>{recordLabel}</strong><span>{data?.docs.length ? 'Select Open to review the full record.' : 'Your saved records will appear here.'}</span></div><div className="admin-table-wrap"><table><caption className="sr-only">{title}</caption><thead><tr>{columns.map((column) => <th key={column} scope="col">{fieldLabel(column)}</th>)}<th scope="col">Action</th></tr></thead><tbody>{data?.docs.map((doc) => <tr key={doc.id}>{columns.map((column) => <td key={column}>{column === 'status' && isSubmission ? <select className="admin-status-select" aria-label={`Update status for ${text(doc.title || doc.email || doc.id)}`} value={String(doc.status || 'new')} disabled={updatingStatus === doc.id} onChange={(event) => void updateSubmissionStatus(doc, event.target.value)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select> : text(doc[column])}</td>)}<td><div className="admin-table-actions"><Link className="admin-table-link" href={`/admin/${slug}/${doc.id}`}>Open<span className="sr-only"> {text(doc.title || doc.email || doc.id)}</span></Link>{slug === 'events' ? <button type="button" className="admin-table-delete" disabled={deleting === doc.id} onClick={() => void removeEvent(doc)}>{deleting === doc.id ? 'Deleting…' : 'Delete'}</button> : null}</div></td></tr>)}</tbody></table>{data && data.docs.length === 0 ? <div className="admin-empty">No records found. Try a different search or create a new record.</div> : null}</div></>
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

function MediaChoice({ label, value, media, onChange, required = false }: { label: string; value: string; media: Doc[]; onChange: (value: string) => void; required?: boolean }) {
  const [open, setOpen] = useState(false)
  const [folder, setFolder] = useState('')
  const selected = media.find((image) => image.id === value)
  const folderNames = Array.from(new Set(media.map((image) => String(image.folder || '')).filter((name) => Boolean(name) && name !== '__unsorted__'))).sort((a, b) => a.localeCompare(b))
  const folderCards = [{ id: '__unsorted__', name: 'Unsorted' }, ...folderNames.map((name) => ({ id: name, name }))]
  const visibleMedia = media.filter((image) => folder === '__unsorted__' ? !image.folder || image.folder === '__unsorted__' : image.folder === folder)
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); setFolder('') } }
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape) }
  }, [open])
  function closePicker() { setOpen(false); setFolder('') }
  function chooseImage(id: string) { onChange(id); closePicker() }
  return <div className="admin-form admin-media-choice"><span>{label}{required ? ' *' : ''}</span><div className={`admin-media-choice__control ${selected ? 'has-selection' : ''}`}>{selected ? <><div className="admin-media-choice__selected-image">{selected.url ? <img src={String(selected.url)} alt={String(selected.filename || '')} /> : null}</div><div className="admin-media-choice__selected-copy"><strong>{String(selected.filename || selected.id)}</strong><small>{String(selected.folder && selected.folder !== '__unsorted__' ? selected.folder : 'Unsorted')}</small></div></> : <><span className="admin-media-choice__empty-icon"><Images size={21} /></span><div className="admin-media-choice__selected-copy"><strong>No image selected</strong><small>Choose from the media library</small></div></>}<div className="admin-media-choice__control-actions"><button type="button" className="admin-secondary" onClick={() => setOpen(true)}>{selected ? 'Change image' : 'Choose image'}</button>{selected && !required ? <button type="button" className="admin-media-choice__remove" onClick={() => onChange('')}>Remove</button> : null}</div></div>{open ? <div className="admin-media-modal" role="dialog" aria-modal="true" aria-label={`${label} picker`}><button type="button" className="admin-media-modal__backdrop" aria-label="Close image picker" onClick={closePicker} /><section className="admin-media-modal__panel"><header className="admin-media-modal__header"><div><p className="admin-eyebrow">MEDIA LIBRARY</p><h2>{label}</h2><p className="admin-muted">{folder ? `Choose one image from ${folder === '__unsorted__' ? 'Unsorted' : folder}.` : 'Choose a folder to browse its images.'}</p></div><button type="button" className="admin-icon-button admin-media-modal__close" onClick={closePicker} aria-label="Close image picker"><X size={22} /></button></header><div className="admin-media-modal__body">{folder ? <div className="admin-media-choice__toolbar"><button type="button" className="admin-secondary" onClick={() => setFolder('')}>← Back to folders</button><small>{visibleMedia.length} images</small></div> : null}{folder === '' ? <div className="admin-picker-folders">{folderCards.map((item) => <button type="button" className="admin-picker-folder" key={item.id} onClick={() => setFolder(item.id)}><FolderOpen size={20} /><strong>{item.name}</strong><small>{media.filter((image) => item.id === '__unsorted__' ? !image.folder || image.folder === '__unsorted__' : image.folder === item.id).length} images</small></button>)}</div> : visibleMedia.length ? <div className="admin-destination-picker__grid">{visibleMedia.map((image) => <button type="button" className={`admin-destination-image ${image.id === value ? 'is-selected' : ''}`} key={image.id} onClick={() => chooseImage(image.id)}><span className="admin-destination-image__preview">{image.url ? <img src={String(image.url)} alt={String(image.filename || '')} loading="lazy" /> : null}</span><small>{String(image.filename || image.id)}</small></button>)}</div> : <p className="admin-muted">No images in this folder yet.</p>}</div></section></div> : null}{required ? <input className="admin-media-choice__required" tabIndex={-1} required value={value} onChange={() => undefined} aria-label={label} /> : null}</div>
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
  const recordId = section?.[1] && section[1] !== 'new' ? section[1] : undefined
  return <div className="admin-shell"><Sidebar open={open} close={() => setOpen(false)} /><div className="admin-main"><header className="admin-topbar"><button className="admin-icon-button admin-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div><span className="admin-topbar__crumb">LA Fashion Closet</span>{slug ? <><ChevronRight size={14} /><span>{labels[slug] || slug}</span></> : <><ChevronRight size={14} /><span>Overview</span></>}</div><Link href="/" className="admin-topbar__home">Visit site</Link></header><main className="admin-content">{isNewEvent ? <EventForm /> : recordId && slug === 'events' ? <EventForm id={recordId} /> : isNewGallery ? <GalleryForm /> : recordId && slug ? <RecordDetailPage slug={slug} id={recordId} /> : !slug ? <Overview /> : slug === 'media' ? <MediaPage /> : slug === 'home-destinations' ? <HomeDestinationsPage /> : <CollectionPage slug={slug} />}</main></div>{open ? <button className="admin-backdrop" onClick={() => setOpen(false)} aria-label="Close menu" /> : null}</div>
}

export function AdminApp({ section }: { section?: string[] }) {
  return <AdminLoadingProvider><AdminAppContent section={section} /></AdminLoadingProvider>
}

'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { usePageReady } from '@/components/site-loader'

const easeOut = [0.22, 1, 0.36, 1] as const

/** Equirectangular projection for viewBox 0 0 1000 500 */
function project(lon: number, lat: number) {
  return {
    x: ((lon + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 500,
  }
}

const CITIES = [
  { id: 'delhi', label: 'New Delhi', lon: 77.21, lat: 28.61, anchor: 'start' as const, dx: 12, dy: -12 },
  { id: 'la', label: 'Los Angeles', lon: -118.24, lat: 34.05, anchor: 'end' as const, dx: -10, dy: -14 },
  { id: 'mauritius', label: 'Mauritius', lon: 57.5, lat: -20.16, anchor: 'start' as const, dx: 12, dy: 18 },
  { id: 'paris', label: 'Paris', lon: 2.35, lat: 48.86, anchor: 'end' as const, dx: -14, dy: -28 },
  { id: 'cannes', label: 'Cannes', lon: 7.02, lat: 43.55, anchor: 'start' as const, dx: 16, dy: 22 },
]

const ROUTE_BEND = 0.22

/** Irregular tour loop — visits every city once and returns (not a geographic circle). */
const ROUTES: Array<{ from: string; to: string }> = [
  { from: 'la', to: 'delhi' },
  { from: 'delhi', to: 'cannes' },
  { from: 'cannes', to: 'mauritius' },
  { from: 'mauritius', to: 'paris' },
  { from: 'paris', to: 'la' },
]

const cityById = Object.fromEntries(CITIES.map((c) => [c.id, c]))

type Sparkle = {
  id: number
  x: number
  y: number
  size: number
  life: number
  maxLife: number
  vx: number
  vy: number
  rot: number
  kind: 'star' | 'dot'
}

/** Downward arc control point — every route dips the same way (SVG Y grows down). */
function downCurveControl(
  from: { x: number; y: number },
  to: { x: number; y: number },
  bend = ROUTE_BEND,
) {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dist = Math.hypot(to.x - from.x, to.y - from.y)
  return {
    cx: mx,
    cy: my + Math.max(28, dist * bend),
  }
}

function curvePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  bend = ROUTE_BEND,
) {
  const { cx, cy } = downCurveControl(from, to, bend)
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}

/** Continuous loop path: first segment keeps M, later segments append Q only. */
function loopPath(
  segments: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; bend: number }>,
) {
  return segments
    .map((seg, i) => {
      const { cx, cy } = downCurveControl(seg.from, seg.to, seg.bend)
      if (i === 0) {
        return `M ${seg.from.x} ${seg.from.y} Q ${cx} ${cy} ${seg.to.x} ${seg.to.y}`
      }
      return `Q ${cx} ${cy} ${seg.to.x} ${seg.to.y}`
    })
    .join(' ')
}

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(0.68)`}>
      <circle r="13" fill="rgba(212,165,116,0.14)" className="world-pin-pulse" />
      <ellipse cx="0" cy="1.5" rx="5" ry="3.2" fill="rgba(255,244,220,0.75)" />
      <path
        d="M0 0 C0 0 9.4 -9.4 9.4 -15.4 C9.4 -20.7 5.2 -26 0 -26 C-5.2 -26 -9.4 -20.7 -9.4 -15.4 C-9.4 -9.4 0 0 0 0 Z"
        fill="url(#pin-metal)"
        stroke="#e8c49a"
        strokeWidth="1.2"
      />
      <path
        d="M-3.8 -23 C-1 -25.2 2.6 -25.1 4.8 -22.6 C1.8 -24.4 -1.4 -24.6 -3.2 -23.2 Z"
        fill="rgba(255,250,235,0.7)"
      />
      <circle cx="0" cy="-15.4" r="3.15" fill="#f7e8c8" />
      <circle cx="0" cy="-15.4" r="1.55" fill="#2a2118" />
    </g>
  )
}

function CityLabel({
  x,
  y,
  dx,
  dy,
  anchor,
  label,
}: {
  x: number
  y: number
  dx: number
  dy: number
  anchor: 'start' | 'middle' | 'end'
  label: string
}) {
  const text = label.toUpperCase()
  const width = text.length * 6.2 + 14
  const height = 15
  const tx = x + dx
  const ty = y + dy
  const bx =
    anchor === 'end' ? tx - width : anchor === 'middle' ? tx - width / 2 : tx

  return (
    <g>
      <rect
        x={bx}
        y={ty - 11}
        width={width}
        height={height}
        rx={7.5}
        fill="rgba(5,5,6,0.72)"
        stroke="rgba(212,165,116,0.22)"
        strokeWidth="0.7"
      />
      <text
        x={tx}
        y={ty}
        textAnchor={anchor}
        fill="#f4f0e8"
        fontSize="8.5"
        letterSpacing="2.2"
        style={{ fontFamily: 'var(--font-body), sans-serif' }}
      >
        {text}
      </text>
    </g>
  )
}

function sparkleTone(id: number) {
  const tones = ['#fff8ee', '#f0d7b4', '#e8c9a0', '#d4a574']
  return tones[id % tones.length]
}

export function WorldMapHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const mapStageRef = useRef<HTMLDivElement>(null)
  const planeGroupRef = useRef<SVGGElement>(null)
  const routePathRef = useRef<SVGPathElement>(null)
  const sparkleCanvasRef = useRef<HTMLCanvasElement>(null)
  const sparklesRef = useRef<Sparkle[]>([])
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const sparkleId = useRef(0)
  const reduceMotion = useReducedMotion()
  const { ready } = usePageReady()

  const enter = (delay = 0, duration = 0.85) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: false,
          animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
          transition: { duration, delay, ease: easeOut },
        }

  const enterScale = (delay = 0, duration = 1.1) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: false,
          animate: ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 },
          transition: { duration, delay, ease: easeOut },
        }

  const enterRise = (delay = 0, duration = 1.05) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: false,
          animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 },
          transition: { duration, delay, ease: easeOut },
        }

  const points = useMemo(
    () => CITIES.map((c) => ({ ...c, ...project(c.lon, c.lat) })),
    [],
  )

  const routes = useMemo(
    () =>
      ROUTES.map((route) => {
        const fromPoint = project(cityById[route.from].lon, cityById[route.from].lat)
        const toPoint = project(cityById[route.to].lon, cityById[route.to].lat)
        return {
          ...route,
          fromPoint,
          toPoint,
          d: curvePath(fromPoint, toPoint, ROUTE_BEND),
        }
      }),
    [],
  )

  const fullLoopPath = useMemo(
    () =>
      loopPath(
        routes.map((route) => ({
          from: route.fromPoint,
          to: route.toPoint,
          bend: ROUTE_BEND,
        })),
      ),
    [routes],
  )

  // Drive plane along the route with JS — SMIL animateMotion breaks under React re-renders
  useEffect(() => {
    if (!ready) return
    const plane = planeGroupRef.current
    const route = routePathRef.current
    if (!plane || !route) return

    let raf = 0
    const durationMs = 48000
    // Wait for hero enter so the plane fades in before traveling
    const startDelayMs = reduceMotion ? 0 : 1100
    const startedAt = performance.now() + startDelayMs

    const tick = (now: number) => {
      if (now < startedAt) {
        plane.style.opacity = '0'
        raf = requestAnimationFrame(tick)
        return
      }

      const length = route.getTotalLength()
      if (length > 0) {
        const elapsed = now - startedAt
        const fade = Math.min(1, elapsed / 500)
        plane.style.opacity = String(fade)
        const t = (elapsed % durationMs) / durationMs
        const point = route.getPointAtLength(t * length)
        const ahead = route.getPointAtLength(Math.min(length, t * length + 1.5))
        const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI
        plane.setAttribute('transform', `translate(${point.x}, ${point.y}) rotate(${angle})`)
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fullLoopPath, reduceMotion, ready])

  // Gold sparkles trail around the pointer (desktop only — skipped on touch)
  useEffect(() => {
    const section = sectionRef.current
    const sparkleCanvas = sparkleCanvasRef.current
    if (!section || !sparkleCanvas) return
    if (window.matchMedia('(max-width: 767px), (pointer: coarse)').matches) return

    let raf = 0
    let lastSpawn = 0
    let started = false
    let idleId = 0
    let timeoutId = 0

    const spawn = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 0.4 + Math.random() * 1.7
        const ring = 10 + Math.random() * 16
        sparklesRef.current.push({
          id: sparkleId.current++,
          x: x + Math.cos(angle) * ring,
          y: y + Math.sin(angle) * ring,
          size: 2 + Math.random() * 4.2,
          life: 0,
          maxLife: 280 + Math.random() * 380,
          vx: Math.cos(angle) * speed * 0.55,
          vy: Math.sin(angle) * speed * 0.55 - 0.35,
          rot: Math.random() * Math.PI,
          kind: Math.random() > 0.4 ? 'star' : 'dot',
        })
      }
      if (sparklesRef.current.length > 80) {
        sparklesRef.current.splice(0, sparklesRef.current.length - 80)
      }
    }

    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, active: true }
      const now = performance.now()
      if (now - lastSpawn > 40) {
        spawn(e.clientX, e.clientY, 1 + Math.floor(Math.random() * 2))
        lastSpawn = now
      }
    }

    const onLeave = () => {
      pointerRef.current.active = false
    }

    const drawSparkles = (time: number) => {
      const rect = section.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      sparkleCanvas.width = Math.max(1, Math.floor(rect.width * dpr))
      sparkleCanvas.height = Math.max(1, Math.floor(rect.height * dpr))
      sparkleCanvas.style.width = `${rect.width}px`
      sparkleCanvas.style.height = `${rect.height}px`

      const ctx = sparkleCanvas.getContext('2d', { alpha: true })
      if (!ctx) {
        raf = requestAnimationFrame(drawSparkles)
        return
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, rect.width, rect.height)

      const { x, y, active } = pointerRef.current
      if (active && time - lastSpawn > 90) {
        spawn(x, y, 1)
        lastSpawn = time
      }

      if (!active && sparklesRef.current.length === 0) {
        raf = requestAnimationFrame(drawSparkles)
        return
      }

      const next: Sparkle[] = []
      for (const s of sparklesRef.current) {
        s.life += 16
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.018
        if (s.life >= s.maxLife) continue

        const t = 1 - s.life / s.maxLife
        const px = s.x - rect.left
        const py = s.y - rect.top
        const size = s.size * (0.55 + t * 0.7)

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(s.rot + s.life * 0.004)
        ctx.globalAlpha = Math.max(0, t)

        if (s.kind === 'star') {
          ctx.fillStyle = '#fff4e0'
          ctx.beginPath()
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2
            const r1 = size
            const r2 = size * 0.28
            ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1)
            ctx.lineTo(Math.cos(a + Math.PI / 4) * r2, Math.sin(a + Math.PI / 4) * r2)
          }
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.fillStyle = sparkleTone(s.id)
          ctx.beginPath()
          ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
        next.push(s)
      }
      sparklesRef.current = next
      raf = requestAnimationFrame(drawSparkles)
    }

    const start = () => {
      if (started) return
      started = true
      section.addEventListener('pointermove', onMove, { passive: true })
      section.addEventListener('pointerleave', onLeave)
      raf = requestAnimationFrame(drawSparkles)
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: 1500 })
    } else {
      timeoutId = window.setTimeout(start, 400)
    }

    return () => {
      cancelAnimationFrame(raf)
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) window.clearTimeout(timeoutId)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  // Scale map via DOM (not React state) so scroll re-renders don't kill SMIL plane motion
  useEffect(() => {
    let raf = 0
    const mq = window.matchMedia('(max-width: 767px)')

    const update = () => {
      const stage = mapStageRef.current
      if (!stage) return
      const boost = mq.matches ? 1.3 : 1
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)))
      const scale = (1 + progress * 0.14) * boost
      stage.style.transform = `scale(${scale})`
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    update()
    mq.addEventListener('change', update)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      mq.removeEventListener('change', update)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative isolate h-[100svh] overflow-hidden bg-[#050506]"
    >
      <motion.div
        {...(reduceMotion
          ? { initial: false, animate: { opacity: 1 } }
          : {
              initial: false,
              animate: { opacity: ready ? 1 : 0 },
              transition: { duration: 1.1, ease: easeOut },
            })}
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 28% at 50% 0%, rgba(232,201,160,0.28), transparent 70%),
            radial-gradient(ellipse 40% 22% at 18% 30%, rgba(212,165,116,0.1), transparent 70%),
            radial-gradient(ellipse 40% 22% at 82% 28%, rgba(212,165,116,0.1), transparent 70%),
            radial-gradient(ellipse 60% 35% at 50% 100%, rgba(212,165,116,0.18), transparent 70%)
          `,
        }}
      />

      {/* Scroll scale lives on mapStageRef; enter animation on an outer wrapper */}
      <motion.div
        {...enterScale(0.05, 1.25)}
        className="absolute inset-x-[-32%] inset-y-[-4%] sm:inset-x-[-14%] sm:inset-y-[4%] md:inset-x-[-2%] md:inset-y-[4%]"
      >
        <div
          ref={mapStageRef}
          className="absolute inset-0 origin-center will-change-transform"
        >
          {/* Pre-rendered dotted map — avoids shipping / painting 12k SVG/canvas dots */}
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet="/world-map-dots-1000.webp"
              type="image/webp"
            />
            <img
              src="/world-map-dots.webp"
              alt=""
              width={2000}
              height={1000}
              decoding="async"
              fetchPriority="low"
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          </picture>

          <motion.svg
            viewBox="0 0 1000 500"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
            aria-hidden
            {...(reduceMotion
              ? { initial: false, animate: { opacity: 1 } }
              : {
                  initial: false,
                  animate: { opacity: ready ? 1 : 0 },
                  transition: { duration: 0.9, delay: 0.35, ease: easeOut },
                })}
          >
            <defs>
              <linearGradient id="route-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e8c49a" stopOpacity="0.35" />
                <stop offset="20%" stopColor="#f0d7b4" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ffd79a" stopOpacity="1" />
                <stop offset="80%" stopColor="#f0d7b4" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#e8c49a" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="pin-metal" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#f6e2b8" />
                <stop offset="35%" stopColor="#e0b87a" />
                <stop offset="68%" stopColor="#c49258" />
                <stop offset="100%" stopColor="#9a6a35" />
              </linearGradient>
            </defs>

            {/* Hidden measuring path for JS plane motion */}
            <path
              ref={routePathRef}
              d={fullLoopPath}
              fill="none"
              stroke="none"
              aria-hidden
            />

            {routes.map((route, i) => (
              <g key={`${route.from}-${route.to}`}>
                <path
                  d={route.d}
                  fill="none"
                  stroke="rgba(232,196,120,0.32)"
                  strokeWidth="2.4"
                />
                <path
                  d={route.d}
                  fill="none"
                  stroke="url(#route-gold)"
                  strokeWidth="1.75"
                  strokeDasharray="2.4 2.8"
                  strokeLinecap="round"
                  className="world-route-dash"
                  style={{ animationDelay: `${i * -2.8}s` }}
                />
              </g>
            ))}

            <g ref={planeGroupRef} style={{ opacity: 0 }}>
              <g transform="translate(0.9, 1.1) scale(1.7)" opacity="0.35">
                <path
                  d="M11 0 C9.5 -0.9 6 -1.15 2 -1.1 L-1.2 -6.8 L-2.6 -6.6 L-1.1 -1.15 L-6.5 -1 L-8.2 -3.4 L-9.4 -3.1 L-8.3 -0.85 L-11.2 -0.55 L-11.2 0.55 L-8.3 0.85 L-9.4 3.1 L-8.2 3.4 L-6.5 1 L-1.1 1.15 L-2.6 6.6 L-1.2 6.8 L2 1.1 C6 1.15 9.5 0.9 11 0 Z"
                  fill="#000"
                />
              </g>
              <g transform="scale(1.7)">
                <path
                  d="M0.2 -1.05 L-0.3 -7.1 L1.6 -7.35 L2.9 -1.05 Z M0.2 1.05 L-0.3 7.1 L1.6 7.35 L2.9 1.05 Z"
                  fill="#f0d7b4"
                  stroke="#b88855"
                  strokeWidth="0.45"
                  strokeLinejoin="round"
                />
                <ellipse cx="0.9" cy="-3.6" rx="1.15" ry="0.55" fill="#e8c9a0" stroke="#b88855" strokeWidth="0.35" />
                <ellipse cx="0.9" cy="3.6" rx="1.15" ry="0.55" fill="#e8c9a0" stroke="#b88855" strokeWidth="0.35" />
                <path
                  d="M10.8 0 C9.2 -1.05 5.5 -1.25 1.8 -1.2 C-1.5 -1.15 -5 -0.95 -7.6 -0.55 C-9.1 -0.35 -10.4 -0.15 -11.1 0 C-10.4 0.15 -9.1 0.35 -7.6 0.55 C-5 0.95 -1.5 1.15 1.8 1.2 C5.5 1.25 9.2 1.05 10.8 0 Z"
                  fill="#fff4e4"
                  stroke="#c49258"
                  strokeWidth="0.55"
                  strokeLinejoin="round"
                />
                <g fill="#8a5a2b">
                  <circle cx="6.2" cy="0" r="0.32" />
                  <circle cx="4.7" cy="0" r="0.32" />
                  <circle cx="3.2" cy="0" r="0.32" />
                  <circle cx="1.7" cy="0" r="0.32" />
                  <circle cx="0.2" cy="0" r="0.32" />
                  <circle cx="-1.3" cy="0" r="0.32" />
                </g>
                <path
                  d="M-8.4 0 L-10.6 -4.2 L-9.1 -4.35 L-7.6 -0.35 Z"
                  fill="#f0d7b4"
                  stroke="#b88855"
                  strokeWidth="0.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M-7.8 -0.35 L-9.3 -2.5 L-8.2 -2.55 L-7.2 -0.25 Z M-7.8 0.35 L-9.3 2.5 L-8.2 2.55 L-7.2 0.25 Z"
                  fill="#e8c9a0"
                  stroke="#b88855"
                  strokeWidth="0.35"
                  strokeLinejoin="round"
                />
                <ellipse cx="10.1" cy="0" rx="0.85" ry="0.55" fill="#fffaf0" />
              </g>
            </g>

            {points.map((city) => (
              <g key={city.id}>
                <Pin x={city.x} y={city.y} />
                <g className="max-sm:opacity-0 sm:opacity-100">
                  <CityLabel
                    x={city.x}
                    y={city.y}
                    dx={city.dx}
                    dy={city.dy}
                    anchor={city.anchor}
                    label={city.label}
                  />
                </g>
              </g>
            ))}
          </motion.svg>
        </div>
      </motion.div>

      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,5,6,0.5) 0%, transparent 18%, transparent 78%, rgba(5,5,6,0.85) 100%)',
        }}
      />

      <motion.div
        {...(reduceMotion
          ? { initial: false, animate: { opacity: 1 } }
          : {
              initial: false,
              animate: { opacity: ready ? 1 : 0 },
              transition: { duration: 1, delay: 0.55, ease: easeOut },
            })}
        className="hero-title-marquee-wrap pointer-events-none absolute inset-x-0 z-[15] overflow-hidden md:z-[6]"
      >
        <h1 className="sr-only">Fashion Beyond Borders</h1>
        <div className="hero-title-marquee" aria-hidden>
          {[0, 1].map((copy) => (
            <p
              key={copy}
              className="flex shrink-0 items-center px-3 font-[family-name:var(--font-display)] text-[clamp(1.9rem,9.5vw,3.25rem)] leading-none tracking-[0.06em] opacity-90 sm:px-4 sm:text-[clamp(3.6rem,14vw,11rem)] sm:opacity-100"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, #fff6e4 0%, #f0d7b4 28%, #d4a574 62%, #b88855 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter:
                  'drop-shadow(0 2px 2px rgba(0,0,0,0.45)) drop-shadow(0 10px 30px rgba(0,0,0,0.55))',
              }}
            >
              <span className="px-4 sm:px-6 md:px-10">FASHION BEYOND BORDERS</span>
              <span className="px-4 text-[0.55em] text-[var(--champagne)] opacity-70 sm:px-6 md:px-10">·</span>
              <span className="px-4 sm:px-6 md:px-10">FASHION BEYOND BORDERS</span>
              <span className="px-4 text-[0.55em] text-[var(--champagne)] opacity-70 sm:px-6 md:px-10">·</span>
            </p>
          ))}
        </div>
      </motion.div>

      <motion.div
        {...enterRise(0.2, 1.15)}
        className="pointer-events-none absolute inset-0 z-[8] overflow-hidden"
      >
        <div className="absolute inset-x-[0%] bottom-0 h-[74%] sm:inset-x-[-8%] sm:h-[86%] md:inset-x-[-6%] md:h-[88%] lg:inset-x-auto lg:left-1/2 lg:top-0 lg:h-full lg:w-full lg:max-w-[1120px] lg:-translate-x-1/2 xl:max-w-[1200px]">
          <div
            className="absolute left-1/2 top-[10%] h-[78%] w-[100%] -translate-x-1/2 rounded-full blur-3xl lg:top-[12%] lg:h-[75%] lg:w-[82%]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(240,215,180,0.45) 0%, rgba(212,165,116,0.28) 38%, rgba(184,136,85,0.12) 62%, transparent 78%)',
            }}
          />
          <div
            className="absolute left-1/2 top-[20%] h-[58%] w-[62%] -translate-x-1/2 rounded-full blur-2xl lg:top-[22%] lg:h-[58%] lg:w-[52%]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,244,220,0.35) 0%, rgba(232,201,160,0.18) 50%, transparent 75%)',
            }}
          />
          <picture>
            <source media="(max-width: 640px)" srcSet="/banner_lady-800.webp" type="image/webp" />
            <source media="(max-width: 1024px)" srcSet="/banner_lady-1200.webp" type="image/webp" />
            <img
              src="/banner_lady.webp"
              alt=""
              width={1536}
              height={1024}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 z-[1] h-full w-full object-cover object-[center_18%] drop-shadow-[0_0_40px_rgba(212,165,116,0.35)] lg:object-contain lg:object-bottom"
            />
          </picture>
          <div className="absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-[#050506] via-[#050506]/55 to-transparent sm:h-28" />
        </div>
      </motion.div>

      <canvas
        ref={sparkleCanvasRef}
        className="pointer-events-none absolute inset-0 z-30 hidden touch-none md:block"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-[2%] z-20 flex justify-center px-4 sm:bottom-[6%] md:bottom-[7%]">
        <motion.div
          {...enter(0.85, 0.75)}
          className="w-[min(46vw,190px)] sm:w-[min(58vw,320px)] md:w-[420px]"
        >
          <Image
            src="/logo.png"
            alt="LA Fashion Closet by Shagun"
            width={560}
            height={284}
            sizes="(max-width: 640px) 48vw, (max-width: 768px) 250px, 280px"
            unoptimized
            className="h-auto w-full object-cover object-center drop-shadow-[0_8px_28px_rgba(0,0,0,0.65),0_0_28px_rgba(212,165,116,0.22)]"
          />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 top-[48%] z-20 flex flex-col items-center px-6 sm:top-[44%] sm:px-6 md:top-[50%]">
        <motion.div
          {...enter(0.55, 0.7)}
          className="flex w-full max-w-[15.5rem] flex-col items-stretch gap-1.5 sm:max-w-none sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 md:gap-4"
        >
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--champagne)] px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#14120f] shadow-[0_0_28px_rgba(212,165,116,0.28)] transition hover:bg-[var(--cream)] sm:gap-2 sm:px-7 sm:py-3.5 sm:text-sm sm:tracking-[0.14em]"
          >
            Upcoming events
            <ArrowUpRight size={12} className="sm:hidden" />
            <ArrowUpRight size={16} className="hidden sm:block" />
          </Link>
          <Link
            href="/galleries"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--champagne)]/55 bg-[#0c0d0f]/55 px-3.5 py-2 text-[9px] uppercase tracking-[0.11em] text-[var(--cream)] backdrop-blur-sm transition hover:border-[var(--champagne)] hover:text-[var(--champagne)] sm:gap-2 sm:px-7 sm:py-3.5 sm:text-sm sm:tracking-[0.14em]"
          >
            Our gallery
            <ArrowUpRight size={12} className="sm:hidden" />
            <ArrowUpRight size={16} className="hidden sm:block" />
          </Link>
        </motion.div>

        <motion.p
          {...enter(0.7, 0.7)}
          className="mt-1 max-w-[17rem] text-center text-[10px] font-medium uppercase leading-snug tracking-[0.14em] text-white/95 sm:mt-5 sm:max-w-none sm:text-[12px] sm:tracking-[0.34em] md:mt-6 md:text-[13px]"
          style={{
            textShadow:
              '0 0 12px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.7)',
          }}
        >
          One vision · Global stage · Limitless fashion
        </motion.p>
      </div>
    </section>
  )
}

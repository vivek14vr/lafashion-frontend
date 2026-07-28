'use client'

/** Rounded gold double-frame with metallic stroke */
export function OrnateGoldFrame({
  uid,
  aspect = 'portrait',
}: {
  uid: string
  aspect?: 'portrait' | 'wide'
}) {
  const w = 100
  const h = aspect === 'wide' ? 120 : 140
  const n = 14
  const inset = 3.2
  const ni = Math.max(8, n - 1.5)

  const framePath = (pad: number, radius: number) => {
    const x0 = pad
    const y0 = pad
    const x1 = w - pad
    const y1 = h - pad
    const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2)
    // Smooth rounded rectangle (circular corner arcs)
    return [
      `M ${x0 + r} ${y0}`,
      `L ${x1 - r} ${y0}`,
      `A ${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
      `L ${x1} ${y1 - r}`,
      `A ${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
      `L ${x0 + r} ${y1}`,
      `A ${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
      `L ${x0} ${y0 + r}`,
      `A ${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
      'Z',
    ].join(' ')
  }

  const outer = framePath(0.6, n)
  const inner = framePath(inset, ni)
  const gradId = `${uid}-gold`

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#fff6e4" />
          <stop offset="22%" stopColor="#f0d7b4" />
          <stop offset="48%" stopColor="#d4a574" />
          <stop offset="72%" stopColor="#c4925e" />
          <stop offset="100%" stopColor="#9a7344" />
        </linearGradient>
      </defs>

      <path
        d={outer}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d={inner}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="0.7"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  )
}

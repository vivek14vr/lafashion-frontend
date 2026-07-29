'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'

type LoaderContextValue = {
  /** True once the intro loader has finished. */
  ready: boolean
}

const LoaderContext = createContext<LoaderContextValue>({ ready: true })

export function usePageReady() {
  return useContext(LoaderContext)
}

const MIN_MS = 1800
const MAX_MS = 4500
const easeOut = [0.22, 1, 0.36, 1] as const

function SiteLoaderOverlay({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion()
  const [progress, setProgress] = useState(8)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const started = performance.now()
    let raf = 0
    let finished = false
    let assetsReady = document.readyState === 'complete'

    const finish = () => {
      if (finished) return
      finished = true
      setProgress(100)
      setExiting(true)
      window.setTimeout(onDone, reduceMotion ? 180 : 720)
    }

    const onLoad = () => {
      assetsReady = true
    }
    window.addEventListener('load', onLoad)
    if (document.readyState === 'complete') assetsReady = true

    const tick = (now: number) => {
      const elapsed = now - started
      const softCap = assetsReady ? 0.94 : 0.7
      const eased = 1 - Math.exp(-elapsed / 850)
      const next = Math.min(99, Math.max(8, Math.floor(eased * softCap * 100)))
      setProgress((prev) => Math.max(prev, next))

      const minMet = elapsed >= (reduceMotion ? 350 : MIN_MS)
      const maxMet = elapsed >= MAX_MS
      if ((assetsReady && minMet) || maxMet) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('load', onLoad)
    }
  }, [onDone, reduceMotion])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#050506]"
      initial={reduceMotion ? false : { opacity: 1 }}
      animate={
        exiting
          ? reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: '-6%' }
          : { opacity: 1, y: 0 }
      }
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '-6%' }}
      transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: easeOut }}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 40% at 50% 42%, rgba(212,165,116,0.16), transparent 70%),
            radial-gradient(ellipse 70% 50% at 50% 100%, rgba(212,165,116,0.08), transparent 65%)
          `,
        }}
      />

      <motion.div
        className="relative z-10 flex w-full max-w-sm flex-col items-center px-8"
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: easeOut }}
      >
        <motion.div
          className="relative h-14 w-[220px] sm:h-16 sm:w-[260px]"
          initial={reduceMotion ? false : { opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.85, delay: 0.1, ease: easeOut }}
        >
          <Image
            src="/logo.webp"
            alt="LA Fashion Closet by Shagun"
            fill
            priority
            unoptimized
            className="object-contain"
          />
        </motion.div>

        <motion.p
          className="mt-7 text-center text-[10px] uppercase tracking-[0.34em] text-[var(--champagne)]/90 sm:text-[11px]"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.25, ease: easeOut }}
        >
          Fashion Beyond Borders
        </motion.p>

        <div className="mt-10 w-full max-w-[200px]">
          <div className="h-px w-full overflow-hidden bg-white/10">
            <div
              className="h-full bg-[var(--champagne)] transition-[width] duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-center text-[9px] uppercase tracking-[0.28em] text-[var(--muted)]">
            {exiting ? 'Entering' : 'Loading'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function SiteLoader({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  // Always show on full page load / reload. Layout stays mounted for client navigations,
  // so in-app route changes will not replay the intro.
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    document.documentElement.classList.add('lafashion-loading')
    return () => {
      document.documentElement.classList.remove('lafashion-loading')
    }
  }, [])

  const onDone = useCallback(() => {
    document.documentElement.classList.remove('lafashion-loading')
    setShowLoader(false)
    setReady(true)
  }, [])

  const value = useMemo(() => ({ ready }), [ready])

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {showLoader ? <SiteLoaderOverlay key="intro" onDone={onDone} /> : null}
      </AnimatePresence>
    </LoaderContext.Provider>
  )
}

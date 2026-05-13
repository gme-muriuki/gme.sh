import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import * as Popover from '@radix-ui/react-popover'
import { useMediaQuery } from '@/app/hooks/useMediaQuery'

type Props = { children: ReactNode }

/**
 * Tufte-style marginalia. Desktop (>=1024px): the note is portalled into
 * the `.editorial-rail` column the Layout already provides, positioned
 * absolutely so its top aligns with the inline marker. A ResizeObserver
 * on <main> recomputes when fonts load or content shifts. Mobile: the
 * marker becomes a popover trigger — the rail isn't rendered.
 */
export function Sidenote({ children }: Props) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const markerRef = useRef<HTMLButtonElement>(null)
  const [n, setN] = useState(0)
  const [rail, setRail] = useState<HTMLElement | null>(null)
  const [top, setTop] = useState(0)

  useLayoutEffect(() => {
    if (!isDesktop) return
    const marker = markerRef.current
    if (!marker) return
    const railEl = document.querySelector<HTMLElement>('.editorial-rail')
    if (!railEl) return
    setRail(railEl)

    const recompute = () => {
      const mr = marker.getBoundingClientRect()
      const rr = railEl.getBoundingClientRect()
      setTop(mr.top - rr.top)
    }

    // 1-based document order, captured once on mount.
    const all = Array.from(
      document.querySelectorAll<HTMLElement>('.sidenote-marker-btn'),
    )
    setN(all.indexOf(marker) + 1)
    recompute()

    const ro = new ResizeObserver(recompute)
    const main = document.querySelector('main')
    if (main) ro.observe(main)
    ro.observe(railEl)
    return () => ro.disconnect()
  }, [isDesktop])

  // Mobile numbering: still order in the doc, but resolved at mount.
  useEffect(() => {
    if (isDesktop || !markerRef.current) return
    const all = Array.from(
      document.querySelectorAll<HTMLElement>('.sidenote-marker-btn'),
    )
    setN(all.indexOf(markerRef.current) + 1)
  }, [isDesktop])

  if (!isDesktop) {
    return (
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            ref={markerRef}
            type="button"
            className="sidenote-marker-btn"
            aria-label={`Sidenote ${n || ''}`}
          >
            <span className="sidenote-marker" aria-hidden>
              {n || ''}
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={6}
            className="sidenote-popover z-50 max-w-[85vw] w-72 rounded-sm border border-rule bg-paper p-3 font-serif text-sm leading-relaxed text-ink-muted shadow-[0_4px_18px_rgba(0,0,0,0.08)]"
          >
            {children}
            <Popover.Arrow className="fill-paper" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    )
  }

  return (
    <>
      <button
        ref={markerRef}
        type="button"
        className="sidenote-marker-btn cursor-default"
        aria-describedby={n ? `sn-${n}` : undefined}
      >
        <span className="sidenote-marker" aria-hidden>
          {n || ''}
        </span>
        <span className="sr-only">sidenote {n}</span>
      </button>
      {rail
        ? createPortal(
            <aside
              id={n ? `sn-${n}` : undefined}
              className="sidenote-margin"
              style={{ top: `${top}px` }}
            >
              <span className="num" aria-hidden>
                {n}
              </span>{' '}
              {children}
            </aside>,
            rail,
          )
        : null}
    </>
  )
}

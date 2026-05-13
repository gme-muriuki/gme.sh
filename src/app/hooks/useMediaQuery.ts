import { useEffect, useState } from 'react'

/**
 * Subscribes to a CSS media query and tracks whether it currently matches.
 *
 * Initializes to `false` when `window` is unavailable (SSR) and updates when the media query match state changes.
 *
 * @param query - A CSS media query string (e.g., "(min-width: 600px)").
 * @returns `true` if the media query currently matches, `false` otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })
  useEffect(() => {
    const mq = window.matchMedia(query)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', listener)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', listener)
  }, [query])
  return matches
}

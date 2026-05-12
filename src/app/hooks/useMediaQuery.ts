import { useEffect, useState } from 'react'

/**
 * Subscribe to a media query and re-render on match changes. SSR-safe:
 * initial value is `false` when window is unavailable so server renders
 * never branch on an unresolved match.
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

import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

function apply(resolved: ResolvedTheme): void {
  const root = document.documentElement
  if (resolved === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  root.style.colorScheme = resolved
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => readMode())
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    typeof window === 'undefined' ? 'light' : resolve(readMode()),
  )

  useEffect(() => {
    const target = resolve(mode)
    setResolved(target)
    apply(target)
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia(DARK_QUERY)
    const listener = (e: MediaQueryListEvent) => {
      const target: ResolvedTheme = e.matches ? 'dark' : 'light'
      setResolved(target)
      apply(target)
    }
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [mode])

  const setMode = useCallback((m: ThemeMode) => setModeState(m), [])

  const toggle = useCallback(() => {
    setModeState((current) => {
      const effective = resolve(current)
      return effective === 'dark' ? 'light' : 'dark'
    })
  }, [])

  return { mode, setMode, resolved, toggle }
}

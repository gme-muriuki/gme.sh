import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
} from '@/styles/theme-colors'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: THEME_COLOR_LIGHT,
  dark: THEME_COLOR_DARK,
}

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
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )
  if (meta) meta.content = THEME_COLOR[resolved]
}

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  resolved: ResolvedTheme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
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

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

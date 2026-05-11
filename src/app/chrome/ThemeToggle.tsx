import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/hooks/useTheme'

export function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="inline-flex size-8 items-center justify-center rounded text-ink-muted hover:text-ink transition-colors"
    >
      {resolved === 'dark' ? (
        <Sun aria-hidden className="size-4" />
      ) : (
        <Moon aria-hidden className="size-4" />
      )}
    </button>
  )
}

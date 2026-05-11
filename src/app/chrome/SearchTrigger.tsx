import { Search } from 'lucide-react'
import { usePalette } from './CommandPalette'

export function SearchTrigger() {
  const { setOpen } = usePalette()
  return (
    <button
      type="button"
      aria-label="Search (⌘K)"
      title="Search (⌘K)"
      className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-ink-muted hover:text-ink transition-colors text-xs"
      onClick={() => setOpen(true)}
    >
      <Search aria-hidden className="size-3.5" />
      <kbd className="hidden sm:inline-flex items-center rounded border border-rule px-1 font-mono text-[10px] text-ink-faint">
        ⌘K
      </kbd>
    </button>
  )
}

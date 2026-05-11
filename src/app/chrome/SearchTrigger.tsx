import { Search } from 'lucide-react'

export function SearchTrigger() {
  return (
    <button
      type="button"
      aria-label="Search (⌘K)"
      title="Search (⌘K)"
      className="inline-flex items-center gap-2 rounded text-ink-muted hover:text-ink transition-colors text-xs"
      onClick={() => {
        // wired in commit 12
        console.info('search palette — pending commit 12')
      }}
    >
      <Search aria-hidden className="size-4" />
      <kbd className="hidden sm:inline-flex items-center rounded border border-rule px-1 font-mono text-[10px] text-ink-muted">
        ⌘K
      </kbd>
    </button>
  )
}

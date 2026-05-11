import { Rss } from 'lucide-react'
import { Wordmark } from './Wordmark'
import { Nav } from './Nav'
import { ThemeToggle } from './ThemeToggle'
import { SearchTrigger } from './SearchTrigger'

// edit this single line to update the "Currently:" status site-wide
const CURRENTLY = 'rewriting a hash-map allocator'

export function Header() {
  return (
    <header className="border-b border-rule">
      <div className="chrome-frame pt-3 pb-2.5">
        <div className="flex items-baseline justify-between gap-6">
          <Wordmark />
          <p className="term-status hidden md:flex items-baseline">
            <span className="prompt">$</span>
            <span className="label">currently:</span>
            <span className="value">{CURRENTLY}</span>
          </p>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-4">
          <Nav />
          <div className="flex items-center -mr-1">
            <SearchTrigger />
            <a
              href="/rss.xml"
              aria-label="RSS feed"
              title="RSS feed"
              className="inline-flex size-7 items-center justify-center rounded text-ink-muted hover:text-ink transition-colors no-underline hover:no-underline"
            >
              <Rss aria-hidden className="size-3.5" />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

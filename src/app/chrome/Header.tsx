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
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="flex items-baseline justify-between gap-6 pt-6 pb-2">
          <Wordmark />
          <p className="text-xs text-ink-muted hidden md:block">
            <span className="font-mono uppercase tracking-wider mr-2">Currently</span>
            <span className="italic">{CURRENTLY}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-6 pb-4">
          <Nav />
          <div className="flex items-center gap-2">
            <SearchTrigger />
            <a
              href="/rss.xml"
              aria-label="RSS feed"
              title="RSS feed"
              className="inline-flex size-8 items-center justify-center rounded text-ink-muted hover:text-ink transition-colors no-underline hover:no-underline"
            >
              <Rss aria-hidden className="size-4" />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

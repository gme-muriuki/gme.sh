import { SquareMark } from './SquareMark'

const year = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 text-sm text-ink-muted">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>James Muriuki</span>
          <SquareMark />
          <span>@gme</span>
          <SquareMark />
          <a href="mailto:hello@example.com" className="hover:text-ink">
            email
          </a>
          <SquareMark />
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-ink">
            github
          </a>
          <SquareMark />
          <a href="/rss.xml" className="hover:text-ink">
            rss
          </a>
        </div>
        <p className="mt-4 text-xs">
          <SquareMark className="mr-2" /> {year}
        </p>
      </div>
    </footer>
  )
}

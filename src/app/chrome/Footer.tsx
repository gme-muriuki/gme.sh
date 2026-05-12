import { SquareMark } from './SquareMark'

const year = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="chrome-frame py-5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
          <span>The Recursion of Learning</span>
          <SquareMark className="text-[7px] mx-0.5" />
          <span className="font-mono">@gme</span>
          <SquareMark className="text-[7px] mx-0.5" />
          <a
            href="mailto:hello@gme.sh"
            className="hover:text-ink no-underline hover:no-underline transition-colors"
          >
            email
          </a>
          <SquareMark className="text-[7px] mx-0.5" />
          <a
            href="https://github.com/gme"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink no-underline hover:no-underline transition-colors"
          >
            github
          </a>
          <SquareMark className="text-[7px] mx-0.5" />
          <a
            href="/rss.xml"
            className="hover:text-ink no-underline hover:no-underline transition-colors"
          >
            rss
          </a>
          <span className="ml-auto text-ink-faint">© {year}</span>
        </p>
      </div>
    </footer>
  )
}

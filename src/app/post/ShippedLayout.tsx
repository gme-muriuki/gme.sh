import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { Tags } from './Tags'

type ShipLink = { label: string; href: string }

type Props = {
  title: string
  dek?: string
  date: string
  hero?: string
  links?: ShipLink[]
  tags?: string[]
  permalink: string
  children: ReactNode
}

export function ShippedLayout({
  title,
  dek,
  date,
  hero,
  links,
  tags,
  permalink,
  children,
}: Props) {
  const parsed = new Date(date)
  return (
    <article>
      <header className="mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-brand font-semibold">
          shipped
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
          {format(parsed, 'd MMM yyyy')}
        </p>
        <h1 className="mt-5 text-[2.875rem] font-bold tracking-tighter leading-[0.98] text-ink max-w-[20ch]">
          {title}
        </h1>
        {dek ? (
          <p className="mt-5 max-w-[52ch] text-[1.125rem] text-ink-muted leading-snug">
            {dek}
          </p>
        ) : null}
        {hero ? (
          <img
            src={hero}
            alt=""
            className="mt-8 rounded border border-rule w-full"
          />
        ) : null}
        {links && links.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink hover:text-brand no-underline hover:no-underline transition-colors"
                >
                  {link.label} &rarr;
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      <div className="prose-essay">{children}</div>
      <footer className="mt-16 border-t border-rule pt-6">
        <Tags tags={tags} />
        <p className="mt-3 font-mono text-[11px] text-ink-faint">
          permalink &mdash;{' '}
          <a
            href={permalink}
            className="text-ink-muted hover:text-ink no-underline hover:no-underline transition-colors"
          >
            {permalink}
          </a>
        </p>
      </footer>
    </article>
  )
}

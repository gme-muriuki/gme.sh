import type { ReactNode } from 'react'
import { format } from 'date-fns'
import type { ShippedFrontmatter } from '*.mdx'
import { Tags } from './Tags'
import { Relations } from './Relations'

type Props = {
  frontmatter: ShippedFrontmatter
  permalink: string
  children: ReactNode
}

export function ShippedLayout({
  frontmatter: f,
  permalink,
  children,
}: Props) {
  const parsed = new Date(f.date)
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
          {f.title}
        </h1>
        {f.dek ? (
          <p className="mt-5 max-w-[52ch] text-[1.125rem] text-ink-muted leading-snug">
            {f.dek}
          </p>
        ) : null}
        {f.hero ? (
          <img
            src={f.hero}
            alt=""
            className="mt-8 rounded border border-rule w-full"
          />
        ) : null}
        {f.links && f.links.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm">
            {f.links.map((link) => (
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
      {f.relations && f.relations.length > 0 ? (
        <Relations relations={f.relations} className="mt-14" />
      ) : null}
      <footer className="mt-16 border-t border-rule pt-6">
        <Tags tags={f.tags} />
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

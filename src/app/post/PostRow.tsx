import { Link } from 'react-router'
import { format } from 'date-fns'
import type { PostEntry } from '@/app/content-index'

type Props = {
  entry: PostEntry
}

const pathPrefix = {
  essay: '/essays',
  note: '/notes',
  shipped: '/shipped',
  page: '/pages',
} as const

const labels = {
  essay: 'Essay',
  note: 'Note',
  shipped: 'Shipped',
  page: 'Page',
} as const

export function PostRow({ entry }: Props) {
  const { frontmatter: f, type } = entry
  const href = `${pathPrefix[type]}/${entry.slug}`
  return (
    <li className="border-b border-rule/60 py-5">
      <Link to={href} className="group block no-underline hover:no-underline">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
          <time dateTime={f.date}>
            {format(new Date(f.date), 'd MMM yyyy')}
          </time>
          <span aria-hidden className="text-ink-faint">
            ·
          </span>
          <span>{labels[type]}</span>
          {typeof f.readingTime === 'number' ? (
            <>
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span>{f.readingTime} min</span>
            </>
          ) : null}
          {f.growth ? (
            <>
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span className="text-brand">{f.growth}</span>
            </>
          ) : null}
        </div>
        <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-ink decoration-rule-strong group-hover:underline">
          {f.title}
        </h3>
        {f.dek ? (
          <p className="mt-1.5 max-w-[60ch] text-[15px] text-ink-muted leading-snug">
            {f.dek}
          </p>
        ) : null}
        {f.tags && f.tags.length > 0 ? (
          <p className="mt-2 font-mono text-[11px] text-ink-faint">
            {f.tags.map((t) => `#${t}`).join('  ')}
          </p>
        ) : null}
      </Link>
    </li>
  )
}

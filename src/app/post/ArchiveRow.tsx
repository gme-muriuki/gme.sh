import { Link } from 'react-router'
import { format } from 'date-fns'
import type { PostEntry } from '@/app/content-index'
import { permalink } from '@/app/lib/permalink'

type Props = {
  entry: PostEntry
}

const typeShort = {
  essay: 'essay',
  note: 'note',
  shipped: 'ship',
  page: 'page',
} as const

export function ArchiveRow({ entry }: Props) {
  const { frontmatter: f, type } = entry
  const href = permalink(type, entry.slug)
  return (
    <li className="border-b border-rule/60 py-3">
      <Link
        to={href}
        className="group flex items-baseline gap-4 no-underline hover:no-underline"
      >
        <time
          dateTime={f.date}
          className="shrink-0 w-16 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted"
        >
          {format(new Date(f.date), 'd MMM')}
        </time>
        <span className="shrink-0 w-12 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
          {typeShort[type]}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium text-ink decoration-rule-strong group-hover:underline">
            {f.title}
          </h3>
          {f.dek ? (
            <p className="mt-0.5 text-sm text-ink-muted leading-snug line-clamp-1">
              {f.dek}
            </p>
          ) : null}
        </div>
        {f.tags && f.tags.length > 0 ? (
          <p className="hidden sm:block font-mono text-[10.5px] text-ink-faint shrink-0">
            {f.tags
              .slice(0, 3)
              .map((t) => `#${t}`)
              .join(' ')}
          </p>
        ) : null}
      </Link>
    </li>
  )
}

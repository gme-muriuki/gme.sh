import type { Relation, RelationKind } from '*.mdx'
import { Link } from 'react-router'
import { findPost, type PostType } from '@/app/content-index'
import { permalink as makePermalink } from '@/app/lib/permalink'

type Props = {
  relations: Relation[]
  className?: string
}

export const KIND_LABEL: Record<RelationKind, string> = {
  influencedBy: 'influenced by',
  contradicts: 'contradicts',
  evolvedFrom: 'evolved from',
  evolvedInto: 'evolved into',
  refinedInto: 'later refined into',
  unresolvedBy: 'unresolved by',
}

type Parsed =
  | { ok: true; type: PostType; slug: string }
  | { ok: false; raw: string }

/**
 * Parse a relation target string of the form `<type>/<slug>` into a structured result.
 *
 * @param target - The raw target string to parse (expected `<type>/<slug>`)
 * @returns `true` result with `{ type, slug }` when `type` is one of `essay`, `note`, `shipped`, or `page` and a `slug` is present; otherwise a `false` result containing the original raw string
 */
function parseTarget(target: string): Parsed {
  const [t, slug] = target.split('/', 2)
  if (
    !slug ||
    (t !== 'essay' && t !== 'note' && t !== 'shipped' && t !== 'page')
  ) {
    return { ok: false, raw: target }
  }
  return { ok: true, type: t, slug }
}

/**
 * Render a “Related” editorial footer listing conceptual relations from frontmatter.
 *
 * Renders each relation's kind label and either a linked post title when the target exists
 * or a faint italic placeholder showing the raw or parsed target when the target is missing.
 *
 * @param relations - Relation entries to display
 * @param className - Optional CSS class applied to the wrapper <section>
 * @returns The rendered section element, or `null` when `relations` is empty
 */
export function Relations({ relations, className }: Props) {
  if (relations.length === 0) return null
  return (
    <section className={className}>
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        Related
      </h2>
      <ul className="space-y-1.5">
        {relations.map((r, i) => {
          const parsed = parseTarget(r.target)
          const post = parsed.ok ? findPost(parsed.type, parsed.slug) : undefined
          return (
            <li
              key={`${r.kind}:${r.target}:${i}`}
              className="flex flex-wrap items-baseline gap-x-2 leading-snug"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted shrink-0">
                {KIND_LABEL[r.kind]}
              </span>
              <span aria-hidden className="text-ink-faint">
                —
              </span>
              {parsed.ok && post ? (
                <Link
                  to={makePermalink(parsed.type, parsed.slug)}
                  className="text-ink hover:text-brand no-underline hover:no-underline transition-colors"
                >
                  {post.frontmatter.title}
                </Link>
              ) : (
                <span
                  className="text-ink-faint italic"
                  title="target not found"
                >
                  {parsed.ok ? `${parsed.type}/${parsed.slug}` : parsed.raw}
                </span>
              )}
              {r.note ? (
                <>
                  <span aria-hidden className="text-ink-faint">
                    —
                  </span>
                  <span className="text-ink-muted">{r.note}</span>
                </>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

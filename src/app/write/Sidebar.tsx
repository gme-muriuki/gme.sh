import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Wordmark } from '@/app/chrome/Wordmark'
import { ThemeToggle } from '@/app/chrome/ThemeToggle'
import { SquareMark } from '@/app/chrome/SquareMark'
import { allPosts } from '@/app/content-index'
import type { PostEntry, PostType } from '@/app/content-index'
import { cn } from '@/app/lib/cn'

type Props = {
  currentFile: { type: PostType; slug: string } | null
  recent: Array<{ type: PostType; slug: string }>
  onSelect: (type: PostType, slug: string) => void
  onNew: (type: PostType) => void
}

const TYPE_SHORT: Record<PostType, string> = {
  essay: 'E',
  note: 'N',
  shipped: 'S',
  page: 'P',
}

type SortKey = 'date' | 'title' | 'status'

export function Sidebar({ currentFile, recent, onSelect, onNew }: Props) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('date')

  const lower = filter.trim().toLowerCase()
  const tagFilter = lower.startsWith('#') ? lower.slice(1) : null

  const filtered = useMemo(() => {
    const base = lower
      ? allPosts.filter((p) => {
          if (p.type === 'page') return false
          if (tagFilter) {
            return (p.frontmatter.tags ?? []).some((t) =>
              t.toLowerCase().includes(tagFilter),
            )
          }
          const t = p.frontmatter.title?.toLowerCase() ?? ''
          if (t.includes(lower)) return true
          if (p.slug.toLowerCase().includes(lower)) return true
          return (p.frontmatter.tags ?? []).some((tag) =>
            tag.toLowerCase().includes(lower),
          )
        })
      : allPosts.filter((p) => p.type !== 'page')

    const arr = [...base]
    if (sort === 'title') {
      arr.sort((a, b) =>
        (a.frontmatter.title ?? a.slug).localeCompare(
          b.frontmatter.title ?? b.slug,
        ),
      )
    } else if (sort === 'status') {
      arr.sort((a, b) => {
        const aDraft = a.frontmatter.draft ? 1 : 0
        const bDraft = b.frontmatter.draft ? 1 : 0
        if (aDraft !== bDraft) return bDraft - aDraft
        return a.frontmatter.date > b.frontmatter.date ? -1 : 1
      })
    }
    // sort === 'date' keeps allPosts default order (already desc)
    return arr
  }, [lower, tagFilter, sort])

  const drafts = useMemo(
    () => allPosts.filter((p) => p.frontmatter.draft === true),
    [],
  )

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of allPosts) {
      for (const t of p.frontmatter.tags ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
  }, [])

  const recentEntries = useMemo(() => {
    return recent
      .map((r) => allPosts.find((p) => p.type === r.type && p.slug === r.slug))
      .filter((p): p is PostEntry => p != null)
  }, [recent])

  return (
    <nav
      aria-label="Files"
      className="h-full flex flex-col font-mono text-[12px]"
    >
      <div className="px-4 py-3 border-b border-rule shrink-0">
        <Wordmark size="sm" />
      </div>

      <div className="border-b border-rule/60 shrink-0">
        <div className="px-3 py-2 flex items-center gap-2">
          <Search aria-hidden className="size-3 text-ink-faint shrink-0" />
          <input
            type="search"
            placeholder="filter… (#tag)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[12px] text-ink placeholder:text-ink-faint"
          />
        </div>
        <div className="px-3 pb-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em]">
          <span className="text-ink-faint">sort</span>
          {(['date', 'title', 'status'] as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              aria-pressed={sort === k}
              className={cn(
                'transition-colors',
                sort === k ? 'nav-active text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        <Section title={lower ? `matching · ${filtered.length}` : 'all posts'}>
          {filtered.length === 0 ? (
            <EmptyLine>no matches</EmptyLine>
          ) : (
            filtered.map((p) => (
              <PostItem
                key={`${p.type}-${p.slug}`}
                entry={p}
                active={
                  currentFile?.type === p.type && currentFile?.slug === p.slug
                }
                onSelect={onSelect}
              />
            ))
          )}
        </Section>

        {drafts.length > 0 ? (
          <Section title={`drafts · ${drafts.length}`}>
            {drafts.map((p) => (
              <PostItem
                key={`d-${p.type}-${p.slug}`}
                entry={p}
                active={
                  currentFile?.type === p.type && currentFile?.slug === p.slug
                }
                onSelect={onSelect}
              />
            ))}
          </Section>
        ) : null}

        {allTags.length > 0 ? (
          <Section title="tags">
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {allTags.map(([t, n]) => {
                const active = tagFilter === t
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => setFilter(active ? '' : `#${t}`)}
                      aria-pressed={active}
                      className={cn(
                        'text-[11px] transition-colors',
                        active
                          ? 'text-brand'
                          : 'text-ink-muted hover:text-ink',
                      )}
                    >
                      #{t}
                      <span className="text-ink-faint ml-0.5">{n}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Section>
        ) : null}

        {recentEntries.length > 0 ? (
          <Section title="recent">
            {recentEntries.map((p) => (
              <PostItem
                key={`r-${p.type}-${p.slug}`}
                entry={p}
                active={
                  currentFile?.type === p.type && currentFile?.slug === p.slug
                }
                onSelect={onSelect}
              />
            ))}
          </Section>
        ) : null}
      </div>

      <div className="border-t border-rule px-3 py-2 shrink-0 flex items-center justify-between gap-2">
        <NewMenu onNew={onNew} />
        <ThemeToggle />
      </div>
    </nav>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <p className="px-1.5 mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint flex items-center gap-1.5">
        <SquareMark className="text-[6px]" />
        {title}
      </p>
      <div>{children}</div>
    </section>
  )
}

function PostItem({
  entry: p,
  active,
  onSelect,
}: {
  entry: PostEntry
  active: boolean
  onSelect: (type: PostType, slug: string) => void
}) {
  const title = p.frontmatter.title ?? p.slug
  return (
    <button
      type="button"
      onClick={() => onSelect(p.type, p.slug)}
      title={`${p.type}/${p.slug}.mdx`}
      className={cn(
        'w-full flex items-baseline gap-2 px-1.5 py-1 rounded text-left transition-colors',
        active
          ? 'bg-paper-raised text-ink'
          : 'text-ink-muted hover:text-ink hover:bg-paper-raised/50',
      )}
    >
      <span
        className={cn(
          'shrink-0 inline-flex items-center justify-center size-3.5 rounded text-[9px] font-semibold',
          active
            ? 'bg-brand/15 text-brand'
            : 'bg-paper-raised text-ink-faint',
        )}
        aria-hidden
      >
        {TYPE_SHORT[p.type]}
      </span>
      <span className="flex-1 min-w-0 truncate text-[12px] leading-tight">
        {title}
      </span>
      {p.frontmatter.draft ? (
        <span
          aria-hidden
          title="draft"
          className="shrink-0 size-1.5 rounded-full bg-brand"
        />
      ) : null}
    </button>
  )
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1.5 py-1 text-[11px] text-ink-faint italic">{children}</p>
  )
}

function NewMenu({ onNew }: { onNew: (t: PostType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors px-1.5 py-1"
      >
        + new
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full mb-1 left-0 min-w-[120px] border border-rule bg-paper shadow-md rounded text-[11px] font-mono"
        >
          {(['essay', 'note', 'shipped', 'page'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="menuitem"
              onClick={() => {
                onNew(t)
                setOpen(false)
              }}
              className="block w-full text-left px-3 py-1.5 text-ink-muted hover:text-ink hover:bg-paper-raised transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

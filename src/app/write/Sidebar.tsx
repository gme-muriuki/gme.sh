import { SOURCE_INDEX } from './sources'
import type { PostType } from '@/app/content-index'
import { cn } from '@/app/lib/cn'

type Props = {
  currentFile: { type: PostType; slug: string } | null
  onSelect: (type: PostType, slug: string) => void
  onNew: (type: PostType) => void
}

const sections: Array<{ type: PostType; label: string }> = [
  { type: 'essay', label: 'essays' },
  { type: 'note', label: 'notes' },
  { type: 'shipped', label: 'shipped' },
  { type: 'page', label: 'pages' },
]

export function Sidebar({ currentFile, onSelect, onNew }: Props) {
  return (
    <nav
      aria-label="Files"
      className="h-full overflow-y-auto px-3 py-4 font-mono text-[12px]"
    >
      {sections.map((s, i) => (
        <div key={s.type} className={i === 0 ? '' : 'mt-6'}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              {s.label}
            </p>
            <button
              type="button"
              onClick={() => onNew(s.type)}
              aria-label={`New ${s.type}`}
              title={`New ${s.type}`}
              className="text-ink-faint hover:text-ink transition-colors text-sm leading-none px-1"
            >
              +
            </button>
          </div>
          <ul>
            {(SOURCE_INDEX[s.type] ?? []).length === 0 ? (
              <li className="text-ink-faint italic text-[11px]">none</li>
            ) : (
              SOURCE_INDEX[s.type].map((slug) => {
                const isActive =
                  currentFile?.type === s.type && currentFile.slug === slug
                return (
                  <li key={slug}>
                    <button
                      type="button"
                      onClick={() => onSelect(s.type, slug)}
                      className={cn(
                        'block w-full text-left py-0.5 truncate transition-colors',
                        isActive
                          ? 'nav-active text-ink'
                          : 'text-ink-muted hover:text-ink',
                      )}
                    >
                      {slug}.mdx
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ))}
    </nav>
  )
}

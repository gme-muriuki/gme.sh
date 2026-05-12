import { PanelLeft, PanelRight } from 'lucide-react'
import { SearchTrigger } from '@/app/chrome/SearchTrigger'
import { SquareMark } from '@/app/chrome/SquareMark'
import { cn } from '@/app/lib/cn'
import type { PostType } from '@/app/content-index'

type Props = {
  currentFile: { type: PostType; slug: string } | null
  isModified: boolean
  isDraft: boolean
  mode: 'edit' | 'preview'
  onModeChange: (m: 'edit' | 'preview') => void
  onPublishToggle: () => void
  panels: { left: boolean; right: boolean }
  onTogglePanel: (side: 'left' | 'right') => void
}

const PATH_PREFIX: Record<PostType, string> = {
  essay: 'essays',
  note: 'notes',
  shipped: 'shipped',
  page: 'pages',
}

export function Toolbar({
  currentFile,
  isModified,
  isDraft,
  mode,
  onModeChange,
  onPublishToggle,
  panels,
  onTogglePanel,
}: Props) {
  const pathLabel = currentFile
    ? `${PATH_PREFIX[currentFile.type]}/${currentFile.slug}.mdx`
    : 'untitled.mdx'

  return (
    <div className="flex items-center gap-3 px-4 h-10 border-b border-rule bg-paper shrink-0">
      <button
        type="button"
        onClick={() => onTogglePanel('left')}
        aria-pressed={panels.left}
        aria-label="Toggle files panel"
        title="Toggle files panel"
        className={cn(
          'inline-flex size-7 items-center justify-center rounded transition-colors -ml-1',
          panels.left ? 'text-ink' : 'text-ink-muted hover:text-ink',
        )}
      >
        <PanelLeft aria-hidden className="size-3.5" />
      </button>
      <p className="term-status hidden md:flex items-baseline min-w-0 flex-1">
        <span className="prompt">$</span>
        <span className="label">edit</span>
        <span className="value truncate">
          {pathLabel}
          {isModified ? <span className="text-brand">*</span> : null}
        </span>
      </p>
      <div className="ml-auto md:ml-0 flex items-center gap-3">
        <ModeTabs mode={mode} onChange={onModeChange} />
        <PublishButton draft={isDraft} onClick={onPublishToggle} />
        <div className="flex items-center -mr-1">
          <SearchTrigger />
          <button
            type="button"
            onClick={() => onTogglePanel('right')}
            aria-pressed={panels.right}
            aria-label="Toggle document properties panel"
            title="Toggle document properties panel"
            className={cn(
              'inline-flex size-7 items-center justify-center rounded transition-colors',
              panels.right ? 'text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            <PanelRight aria-hidden className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: 'edit' | 'preview'
  onChange: (m: 'edit' | 'preview') => void
}) {
  return (
    <div className="inline-flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.18em]">
      <Tab value="edit" active={mode === 'edit'} onClick={() => onChange('edit')} />
      <SquareMark className="text-[6px]" />
      <Tab
        value="preview"
        active={mode === 'preview'}
        onClick={() => onChange('preview')}
      />
    </div>
  )
}

function Tab({
  value,
  active,
  onClick,
}: {
  value: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'no-underline transition-opacity',
        active ? 'nav-active text-ink' : 'text-ink-muted hover:opacity-75',
      )}
    >
      {value}
    </button>
  )
}

function PublishButton({
  draft,
  onClick,
}: {
  draft: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={draft ? 'Publish' : 'Mark as draft'}
      className={cn(
        'font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded transition-colors',
        draft
          ? 'text-brand hover:bg-brand/10'
          : 'text-ink-muted hover:text-ink',
      )}
    >
      {draft ? 'Publish' : 'Mark draft'}
    </button>
  )
}

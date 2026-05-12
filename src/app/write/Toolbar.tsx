import { Wordmark } from '@/app/chrome/Wordmark'
import { SquareMark } from '@/app/chrome/SquareMark'
import { SearchTrigger } from '@/app/chrome/SearchTrigger'
import { cn } from '@/app/lib/cn'
import type { PostType } from '@/app/content-index'

type Props = {
  currentFile: { type: PostType; slug: string } | null
  isModified: boolean
  mode: 'edit' | 'preview'
  onModeChange: (m: 'edit' | 'preview') => void
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
  mode,
  onModeChange,
  panels,
  onTogglePanel,
}: Props) {
  const pathLabel = currentFile
    ? `${PATH_PREFIX[currentFile.type]}/${currentFile.slug}.mdx`
    : 'untitled.mdx'

  return (
    <div className="flex items-center gap-3 px-4 h-10 border-b border-rule bg-paper shrink-0">
      <Wordmark size="sm" />
      <SquareMark className="text-[7px]" />
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
        <div className="flex items-center -mr-1">
          <SearchTrigger />
          <PanelToggle
            label="Files"
            active={panels.left}
            onClick={() => onTogglePanel('left')}
            className="lg:hidden"
          />
          <PanelToggle
            label="Doc"
            active={panels.right}
            onClick={() => onTogglePanel('right')}
            className="xl:hidden"
          />
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

function PanelToggle({
  label,
  active,
  onClick,
  className,
}: {
  label: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] rounded transition-colors',
        active ? 'text-ink' : 'text-ink-muted hover:text-ink',
        className,
      )}
    >
      {label}
    </button>
  )
}

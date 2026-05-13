import { PanelLeft, PanelRight } from 'lucide-react'
import { SearchTrigger } from '@/app/chrome/SearchTrigger'
import { SquareMark } from '@/app/chrome/SquareMark'
import { cn } from '@/app/lib/cn'
import { sourceFilePath } from '@/app/lib/permalink'
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

/**
 * Render the editor toolbar with file path, mode tabs, publish/draft control, search trigger, and left/right panel toggles.
 *
 * @param currentFile - The active file (type and slug) or `null` when no file is selected
 * @param isModified - Whether the current file has unsaved modifications
 * @param isDraft - Whether the current file is marked as a draft
 * @param mode - The current editor mode (`'edit'` or `'preview'`)
 * @param onModeChange - Called with the new mode when the user switches tabs
 * @param onPublishToggle - Called when the publish/mark-draft button is clicked
 * @param panels - Visibility state for the left and right panels
 * @param onTogglePanel - Called with `'left'` or `'right'` to toggle the corresponding panel
 * @returns A JSX element representing the toolbar
 */
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
    ? sourceFilePath(currentFile.type, currentFile.slug)
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
        <PublishButton
          draft={isDraft}
          disabled={currentFile === null}
          onClick={onPublishToggle}
        />
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

/**
 * Render mode selection tabs for "edit" and "preview".
 *
 * @param mode - The currently active mode, either `"edit"` or `"preview"`.
 * @param onChange - Callback invoked with the newly selected mode when a tab is clicked.
 * @returns The tab group element that lets the user switch between edit and preview modes.
 */
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

/**
 * Renders a tab-styled button that displays a label and reflects its active state.
 *
 * @returns A button element that shows `value`, exposes the active state via `aria-pressed`, and invokes `onClick` when pressed.
 */
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

/**
 * Render a publish/draft button whose label, title, and styling reflect the `draft` and `disabled` states.
 *
 * @param draft - If `true`, the control indicates publishing (label "Publish"); otherwise indicates marking as draft (label "Mark draft").
 * @param disabled - If `true`, the control is disabled and shows the tooltip "Save the draft first (assign a slug)".
 * @param onClick - Invoked when the button is clicked.
 * @returns The button element representing the publish/draft control.
 */
function PublishButton({
  draft,
  disabled,
  onClick,
}: {
  draft: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={
        disabled
          ? 'Save the draft first (assign a slug)'
          : draft
            ? 'Publish'
            : 'Mark as draft'
      }
      className={cn(
        'font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded transition-colors',
        disabled
          ? 'text-ink-faint cursor-not-allowed'
          : draft
            ? 'text-brand hover:bg-brand/10'
            : 'text-ink-muted hover:text-ink',
      )}
    >
      {draft ? 'Publish' : 'Mark draft'}
    </button>
  )
}

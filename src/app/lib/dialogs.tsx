import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from './cn'

type SidePanelDrawerProps = {
  side: 'left' | 'right'
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Screen-reader label for the drawer. */
  title: string
  /** Pixel width of the drawer; defaults to 260 (left) / 320 (right). */
  width?: number
  children: ReactNode
}

/**
 * Sticky slide-in panel for narrow viewports — files tree on the left,
 * document properties on the right. Pointer-down / interact-outside are
 * intercepted so native pickers (date input, select) opening from inside
 * the panel don't dismiss it; the only ways out are the toolbar toggle
 * (via parent state) or ESC.
 */
export function SidePanelDrawer({
  side,
  open,
  onOpenChange,
  title,
  width,
  children,
}: SidePanelDrawerProps) {
  const w = width ?? (side === 'left' ? 260 : 320)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-[2px]" />
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          style={{ width }}
          className={cn(
            'fixed inset-y-0 z-50 bg-paper shadow-lg',
            side === 'left' ? 'left-0 border-r border-rule' : 'right-0 border-l border-rule',
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div style={{ width: w }} className="h-full">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Body of the dialog. Anything from a one-line string to a rich preview. */
  description?: ReactNode
  /** Optional note rendered between description and the action row. */
  note?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
}

/**
 * Center-positioned confirmation modal. Cancel label defaults to "cancel".
 * The confirm button is brand-tinted; cancel is plain ink-muted.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  note,
  confirmLabel,
  cancelLabel = 'cancel',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--ink)]/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-[20vh] z-50 -translate-x-1/2 w-[min(480px,92vw)] bg-paper border border-rule rounded shadow-lg p-6">
          <Dialog.Title className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-3">
            {title}
          </Dialog.Title>
          {description ? <div className="mb-6">{description}</div> : null}
          {note ? <p className="text-sm text-ink-muted mb-6">{note}</p> : null}
          <div className="flex justify-end gap-3 font-mono text-[11px] uppercase tracking-[0.18em]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-ink-muted hover:text-ink px-3 py-1 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="text-brand bg-brand/10 hover:bg-brand/20 rounded px-3 py-1 transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

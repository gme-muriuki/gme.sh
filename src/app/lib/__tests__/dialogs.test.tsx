import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidePanelDrawer, ConfirmDialog } from '../dialogs'

// ─── SidePanelDrawer ─────────────────────────────────────────────────────────

describe('SidePanelDrawer', () => {
  it('renders children when open is true', () => {
    render(
      <SidePanelDrawer
        side="left"
        open={true}
        onOpenChange={() => {}}
        title="Files"
      >
        <p>drawer content</p>
      </SidePanelDrawer>,
    )
    expect(screen.getByText('drawer content')).toBeInTheDocument()
  })

  it('does not show content when open is false', () => {
    render(
      <SidePanelDrawer
        side="left"
        open={false}
        onOpenChange={() => {}}
        title="Files"
      >
        <p>hidden content</p>
      </SidePanelDrawer>,
    )
    expect(screen.queryByText('hidden content')).not.toBeInTheDocument()
  })

  it('renders an accessible title for screen readers', () => {
    render(
      <SidePanelDrawer
        side="right"
        open={true}
        onOpenChange={() => {}}
        title="Document settings"
      >
        <span />
      </SidePanelDrawer>,
    )
    // The title is sr-only, but it must exist in the DOM.
    expect(screen.getByText('Document settings')).toBeInTheDocument()
  })

  it('applies default width of 260px for left side', () => {
    render(
      <SidePanelDrawer
        side="left"
        open={true}
        onOpenChange={() => {}}
        title="Files"
      >
        <span />
      </SidePanelDrawer>,
    )
    // The inner div carries the explicit width style.
    const inner = document.querySelector('[style*="width"]') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.style.width).toBe('260px')
  })

  it('applies default width of 320px for right side', () => {
    render(
      <SidePanelDrawer
        side="right"
        open={true}
        onOpenChange={() => {}}
        title="Document"
      >
        <span />
      </SidePanelDrawer>,
    )
    const inner = document.querySelector('[style*="width"]') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.style.width).toBe('320px')
  })

  it('accepts a custom width override', () => {
    render(
      <SidePanelDrawer
        side="left"
        open={true}
        onOpenChange={() => {}}
        title="Custom"
        width={400}
      >
        <span />
      </SidePanelDrawer>,
    )
    const inner = document.querySelector('[style*="width"]') as HTMLElement
    expect(inner.style.width).toBe('400px')
  })

  it('calls onOpenChange when Escape is pressed', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <SidePanelDrawer
        side="left"
        open={true}
        onOpenChange={onOpenChange}
        title="Files"
      >
        <button>inner button</button>
      </SidePanelDrawer>,
    )
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does NOT close when clicking outside (pointer down outside is prevented)', async () => {
    const onOpenChange = vi.fn()
    render(
      <div>
        <SidePanelDrawer
          side="left"
          open={true}
          onOpenChange={onOpenChange}
          title="Files"
        >
          <span>inside</span>
        </SidePanelDrawer>
        <button id="outside">outside</button>
      </div>,
    )
    // The component sets onPointerDownOutside + onInteractOutside preventDefault,
    // so clicking outside should NOT call onOpenChange.
    const outsideEl = document.getElementById('outside')!
    outsideEl.click()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

describe('ConfirmDialog', () => {
  it('renders title, description, and buttons when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete post?"
        description={<p>This action cannot be undone.</p>}
        confirmLabel="delete"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Delete post?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Are you sure?"
        confirmLabel="yes"
        onConfirm={() => {}}
      />,
    )
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm"
        confirmLabel="ok"
        onConfirm={onConfirm}
      />,
    )
    await user.click(screen.getByRole('button', { name: /ok/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onOpenChange(false) when the cancel button is clicked', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirm"
        confirmLabel="yes"
        onConfirm={() => {}}
      />,
    )
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses a custom cancelLabel when provided', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm"
        confirmLabel="confirm"
        cancelLabel="go back"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })

  it('defaults cancelLabel to "cancel"', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm"
        confirmLabel="ok"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('renders an optional note', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm"
        confirmLabel="ok"
        note={<>This cannot be undone.</>}
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('renders without description or note', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Simple confirm"
        confirmLabel="yes"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Simple confirm')).toBeInTheDocument()
    // Should not throw and dialog renders fine.
  })

  it('calls onOpenChange(false) when Escape is pressed', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirm?"
        confirmLabel="yes"
        onConfirm={() => {}}
      />,
    )
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders rich JSX description', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Publish?"
        description={
          <div>
            <p data-testid="title-line">My Post Title</p>
            <p data-testid="dek-line">Short dek here</p>
          </div>
        }
        confirmLabel="publish"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByTestId('title-line')).toHaveTextContent('My Post Title')
    expect(screen.getByTestId('dek-line')).toHaveTextContent('Short dek here')
  })
})
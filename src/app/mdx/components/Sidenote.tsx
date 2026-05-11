import type { ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'

type Props = {
  children: ReactNode
}

// Tufte-style sidenote. desktop: float right into the empty rail.
// mobile: popover triggered by the inline marker.
export function Sidenote({ children }: Props) {
  return (
    <>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button type="button" className="sidenote-marker-btn">
            <span className="sidenote-marker" aria-hidden />
            <span className="sr-only">sidenote</span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={6}
            className="sidenote-popover z-50 max-w-[85vw] w-72 rounded border border-rule bg-paper p-3 font-mono text-xs leading-relaxed text-ink shadow-[0_4px_18px_rgba(0,0,0,0.08)]"
          >
            {children}
            <Popover.Arrow className="fill-paper" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <aside className="sidenote-margin">
        <span className="num" aria-hidden />
        {' '}
        {children}
      </aside>
    </>
  )
}

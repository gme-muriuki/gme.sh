import type { ReactNode } from 'react'

type Variant = 'note' | 'warning' | 'tip' | 'aside'

type Props = {
  type?: Variant
  title?: string
  children: ReactNode
}

const labels: Record<Variant, string> = {
  note: 'Note',
  warning: 'Warning',
  tip: 'Tip',
  aside: 'Aside',
}

export function Callout({ type = 'note', title, children }: Props) {
  return (
    <aside className="my-7 border-l-2 border-brand bg-paper-raised/55 px-5 py-4 text-[15.5px] leading-snug not-prose">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        {title ?? labels[type]}
      </p>
      <div className="text-ink [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  )
}

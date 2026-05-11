import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  title?: string
}

// Placeholder container for embedded React / wasm demos in posts.
export function Demo({ children, title }: Props) {
  return (
    <figure className="my-8 not-prose rounded border border-rule bg-paper-raised/55 p-6">
      <figcaption className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        {title ?? 'interactive demo'}
      </figcaption>
      {children}
    </figure>
  )
}

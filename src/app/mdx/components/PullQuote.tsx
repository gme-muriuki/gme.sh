import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  cite?: string
}

export function PullQuote({ children, cite }: Props) {
  return (
    <blockquote className="my-10 max-w-[40ch] mx-auto text-center text-[1.5rem] leading-[1.25] font-medium italic text-ink not-prose">
      <span aria-hidden className="text-brand mr-1">“</span>
      {children}
      <span aria-hidden className="text-brand ml-1">”</span>
      {cite ? (
        <footer className="mt-3 text-sm font-mono not-italic text-ink-muted">
          — {cite}
        </footer>
      ) : null}
    </blockquote>
  )
}

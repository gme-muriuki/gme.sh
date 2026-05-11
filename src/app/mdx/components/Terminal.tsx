import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

// Terminal/output block. No syntax highlight, slightly darker background,
// no line numbers. Author writes $ prompts themselves.
export function Terminal({ children }: Props) {
  return (
    <figure className="my-6 not-prose">
      <pre className="rounded border border-rule bg-[color-mix(in_oklab,var(--paper)_92%,#000_8%)] dark:bg-[color-mix(in_oklab,var(--paper)_85%,#000_15%)] px-4 py-3 text-[12.75px] font-mono leading-[1.6] text-ink-muted overflow-x-auto">
        {children}
      </pre>
    </figure>
  )
}

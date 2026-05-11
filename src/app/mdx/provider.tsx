import type { ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'

// component map — commit 8 fills this with Sidenote, Callout, CodeBlock, etc.
const components = {}

export function MDXRoot({ children }: { children: ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>
}

import type { ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { Pre } from './components/Pre'
import { Sidenote } from './components/Sidenote'
import { Callout } from './components/Callout'
import { PullQuote } from './components/PullQuote'
import { Terminal } from './components/Terminal'
import { FileTabs } from './components/FileTabs'
import { Mermaid } from './components/Mermaid'
import { Demo } from './components/Demo'

const components = {
  pre: Pre,
  Sidenote,
  Callout,
  PullQuote,
  Terminal,
  FileTabs,
  Mermaid,
  Demo,
}

export function MDXRoot({ children }: { children: ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>
}

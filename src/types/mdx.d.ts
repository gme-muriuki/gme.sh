declare module '*.mdx' {
  import type { ComponentType } from 'react'

  export type Frontmatter = {
    title: string
    date: string
    type?: 'essay' | 'note' | 'shipped' | 'page'
    dek?: string
    tags?: string[]
    series?: { name: string; index: number; total: number }
    growth?: 'seedling' | 'growing' | 'evergreen'
    lastTended?: string
    readingTime?: number
    draft?: boolean
    hero?: string
    links?: { label: string; href: string }[]
    ogImage?: string
    ogDescription?: string
    [key: string]: unknown
  }

  export const frontmatter: Frontmatter

  const MDXComponent: ComponentType
  export default MDXComponent
}

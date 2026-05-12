import type { ReactNode } from 'react'
import type { PageFrontmatter } from '*.mdx'
import { IndexHeader } from '@/app/chrome/IndexHeader'

type Props = {
  frontmatter: PageFrontmatter
  children: ReactNode
}

export function PageLayout({ frontmatter: f, children }: Props) {
  return (
    <article>
      <IndexHeader
        kicker={f.title.toLowerCase()}
        title={f.title}
        dek={f.dek}
      />
      <div className="prose-essay">{children}</div>
    </article>
  )
}

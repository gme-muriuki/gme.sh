import type { ReactNode } from 'react'
import type { PageFrontmatter } from '*.mdx'
import { IndexHeader } from '@/app/chrome/IndexHeader'

type Props = {
  frontmatter: PageFrontmatter
  children: ReactNode
}

/**
 * Renders an article with an IndexHeader and the provided page content.
 *
 * @param frontmatter - Page frontmatter whose `title` and `dek` populate the header; `title` is lowercased for the kicker
 * @param children - Content rendered inside the article's prose container
 * @returns The article JSX element containing the header and content
 */
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

import type { ReactNode } from 'react'
import type { PageFrontmatter } from '*.mdx'
import { IndexHeader } from '@/app/chrome/IndexHeader'

type Props = {
  frontmatter: PageFrontmatter
  children: ReactNode
}

/**
 * Render an article containing an IndexHeader and the page content.
 *
 * @param frontmatter - Page frontmatter; its `title` and `dek` are used to populate the header (the kicker is the title lowercased)
 * @param children - Content to render inside the article's prose container
 * @returns A JSX element representing the page article with header and content
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

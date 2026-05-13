import type { ReactNode } from 'react'
import type { NoteFrontmatter } from '*.mdx'
import { PostMeta } from './PostMeta'
import { Tags } from './Tags'
import { Relations } from './Relations'

type Props = {
  frontmatter: NoteFrontmatter
  permalink: string
  children: ReactNode
}

/**
 * Render the note page layout using the provided frontmatter, permalink, and children.
 *
 * @param frontmatter - Note metadata (e.g., `title`, `tags`, optional `relations`, dates) used to populate the header, tags, and relations section
 * @param permalink - The canonical URL for the note, rendered in the footer
 * @param children - The note's main content to render inside the layout
 * @returns The article element containing the header (metadata and title), content, optional relations, and footer with tags and permalink
 */
export function NoteLayout({ frontmatter: f, permalink, children }: Props) {
  return (
    <article>
      <header className="mb-8">
        <PostMeta frontmatter={f} />
        <h1 className="mt-4 text-[2.25rem] font-semibold tracking-tight leading-[1.02] text-ink max-w-[22ch]">
          {f.title}
        </h1>
      </header>
      <div className="prose-essay">{children}</div>
      {f.relations && f.relations.length > 0 ? (
        <Relations relations={f.relations} className="mt-12" />
      ) : null}
      <footer className="mt-12 border-t border-rule pt-6">
        <Tags tags={f.tags} />
        <p className="mt-3 font-mono text-[11px] text-ink-faint">
          permalink &mdash;{' '}
          <a
            href={permalink}
            className="text-ink-muted hover:text-ink no-underline hover:no-underline transition-colors"
          >
            {permalink}
          </a>
        </p>
      </footer>
    </article>
  )
}

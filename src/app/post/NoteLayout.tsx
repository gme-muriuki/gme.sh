import type { ReactNode } from 'react'
import type { NoteFrontmatter } from '*.mdx'
import { PostMeta } from './PostMeta'
import { Tags } from './Tags'

type Props = {
  frontmatter: NoteFrontmatter
  permalink: string
  children: ReactNode
}

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

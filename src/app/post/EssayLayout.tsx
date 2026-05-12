import type { ReactNode } from 'react'
import type { EssayFrontmatter } from '*.mdx'
import { ReadingProgress } from './ReadingProgress'
import { TableOfContents } from './TableOfContents'
import { SeriesNav } from './SeriesNav'
import { PostMeta } from './PostMeta'
import { Tags } from './Tags'
import { GiscusPlaceholder } from './GiscusPlaceholder'

type Props = {
  frontmatter: EssayFrontmatter
  permalink: string
  children: ReactNode
}

export function EssayLayout({ frontmatter: f, permalink, children }: Props) {
  return (
    <>
      <ReadingProgress />
      <article>
        <header className="mb-12">
          <PostMeta frontmatter={f} />
          <h1 className="mt-4 text-[2.875rem] font-bold tracking-tighter leading-[0.98] text-ink max-w-[20ch]">
            {f.title}
          </h1>
          {f.dek ? (
            <p className="mt-5 max-w-[52ch] text-[1.125rem] text-ink-muted leading-snug">
              {f.dek}
            </p>
          ) : null}
          {f.series ? (
            <div className="mt-6">
              <SeriesNav series={f.series} />
            </div>
          ) : null}
        </header>
        <TableOfContents />
        <div className="prose-essay">{children}</div>
        {f.series ? <SeriesNav series={f.series} className="mt-14" /> : null}
        <footer className="mt-16 border-t border-rule pt-6">
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
        <GiscusPlaceholder />
      </article>
    </>
  )
}

import type { ReactNode } from 'react'
import { ReadingProgress } from './ReadingProgress'
import { TableOfContents } from './TableOfContents'
import { SeriesNav } from './SeriesNav'
import type { Series } from './SeriesNav'
import { PostMeta } from './PostMeta'
import { Tags } from './Tags'
import { GiscusPlaceholder } from './GiscusPlaceholder'

type Props = {
  title: string
  dek?: string
  date: string
  readingTime?: number
  tags?: string[]
  series?: Series
  permalink: string
  children: ReactNode
}

export function EssayLayout({
  title,
  dek,
  date,
  readingTime,
  tags,
  series,
  permalink,
  children,
}: Props) {
  return (
    <>
      <ReadingProgress />
      <article>
        <header className="mb-12">
          <PostMeta type="essay" date={date} readingTime={readingTime} />
          <h1 className="mt-4 text-[2.875rem] font-bold tracking-tighter leading-[0.98] text-ink max-w-[20ch]">
            {title}
          </h1>
          {dek ? (
            <p className="mt-5 max-w-[52ch] text-[1.125rem] text-ink-muted leading-snug">
              {dek}
            </p>
          ) : null}
          {series ? (
            <div className="mt-6">
              <SeriesNav series={series} />
            </div>
          ) : null}
        </header>
        <TableOfContents />
        <div className="prose-essay">{children}</div>
        {series ? <SeriesNav series={series} className="mt-14" /> : null}
        <footer className="mt-16 border-t border-rule pt-6">
          <Tags tags={tags} />
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

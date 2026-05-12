import type { ReactNode } from 'react'
import { EssayLayout } from '@/app/post/EssayLayout'
import { NoteLayout } from '@/app/post/NoteLayout'
import { ShippedLayout } from '@/app/post/ShippedLayout'
import type { Frontmatter } from '*.mdx'
import type { PostType } from '@/app/content-index'

type Props = {
  type: PostType
  frontmatter: Partial<Frontmatter>
  children: ReactNode
}

const PREVIEW_PERMALINK = '/write/preview'

export function Preview({ type, frontmatter: f, children }: Props) {
  const title = f.title ?? 'Untitled'
  const date = f.date ?? new Date().toISOString().slice(0, 10)

  if (type === 'essay') {
    return (
      <EssayLayout
        title={title}
        dek={f.dek}
        date={date}
        readingTime={f.readingTime}
        tags={f.tags}
        series={f.series}
        permalink={PREVIEW_PERMALINK}
      >
        {children}
      </EssayLayout>
    )
  }
  if (type === 'note') {
    return (
      <NoteLayout
        title={title}
        date={date}
        growth={f.growth ?? 'seedling'}
        lastTended={f.lastTended}
        tags={f.tags}
        permalink={PREVIEW_PERMALINK}
      >
        {children}
      </NoteLayout>
    )
  }
  if (type === 'shipped') {
    return (
      <ShippedLayout
        title={title}
        dek={f.dek}
        date={date}
        hero={f.hero}
        links={f.links}
        tags={f.tags}
        permalink={PREVIEW_PERMALINK}
      >
        {children}
      </ShippedLayout>
    )
  }
  return (
    <article>
      <header className="mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          page
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tighter leading-[0.95] text-ink">
          {title}
        </h1>
        {f.dek ? (
          <p className="mt-5 max-w-[44ch] text-base text-ink leading-snug">
            {f.dek}
          </p>
        ) : null}
      </header>
      <div className="prose-essay">{children}</div>
    </article>
  )
}

import { useParams } from 'react-router'
import { findPost } from '@/app/content-index'
import type { PostType } from '@/app/content-index'
import { EssayLayout } from '@/app/post/EssayLayout'
import { NoteLayout } from '@/app/post/NoteLayout'
import { ShippedLayout } from '@/app/post/ShippedLayout'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

type Props = {
  type: 'essay' | 'note' | 'shipped'
}

const pathPrefix: Record<Props['type'], string> = {
  essay: '/essays',
  note: '/notes',
  shipped: '/shipped',
}

export default function PostPage({ type }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const entry = slug ? findPost(type as PostType, slug) : undefined
  useDocumentMeta({
    title: entry?.frontmatter.title,
    description: entry?.frontmatter.dek,
  })
  if (!slug) {
    return <NotHere type={type} slug="" />
  }
  if (!entry) {
    return <NotHere type={type} slug={slug} />
  }

  const { Component, frontmatter } = entry
  const permalink = `${pathPrefix[type]}/${slug}`

  if (type === 'essay') {
    return (
      <EssayLayout
        title={frontmatter.title}
        dek={frontmatter.dek}
        date={frontmatter.date}
        readingTime={frontmatter.readingTime}
        tags={frontmatter.tags}
        series={frontmatter.series}
        permalink={permalink}
      >
        <Component />
      </EssayLayout>
    )
  }
  if (type === 'note') {
    return (
      <NoteLayout
        title={frontmatter.title}
        date={frontmatter.date}
        growth={frontmatter.growth ?? 'seedling'}
        lastTended={frontmatter.lastTended}
        tags={frontmatter.tags}
        permalink={permalink}
      >
        <Component />
      </NoteLayout>
    )
  }
  return (
    <ShippedLayout
      title={frontmatter.title}
      dek={frontmatter.dek}
      date={frontmatter.date}
      hero={frontmatter.hero}
      links={frontmatter.links}
      tags={frontmatter.tags}
      permalink={permalink}
    >
      <Component />
    </ShippedLayout>
  )
}

function NotHere({ type, slug }: { type: string; slug: string }) {
  return (
    <article>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        404
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-tighter leading-[0.95] text-ink">
        Not here.
      </h1>
      <p className="mt-4 max-w-[44ch] text-base text-ink-muted">
        No {type} with slug{' '}
        <code className="font-mono text-ink">{slug || '(empty)'}</code>.
      </p>
    </article>
  )
}

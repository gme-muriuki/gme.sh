import { useParams } from 'react-router'
import { findPost } from '@/app/content-index'
import { permalink } from '@/app/lib/permalink'
import { PostLayout } from '@/app/post/PostLayout'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

type Props = {
  type: 'essay' | 'note' | 'shipped'
}

export default function PostPage({ type }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const entry = slug ? findPost(type, slug) : undefined
  useDocumentMeta({
    title: entry?.frontmatter.title,
    description: entry?.frontmatter.dek,
  })
  if (!slug || !entry) {
    return <NotHere type={type} slug={slug ?? ''} />
  }

  const { Component, frontmatter } = entry
  return (
    <PostLayout frontmatter={frontmatter} permalink={permalink(type, slug)}>
      <Component />
    </PostLayout>
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

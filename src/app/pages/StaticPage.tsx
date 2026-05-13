import { findPost } from '@/app/content-index'
import { PostLayout } from '@/app/post/PostLayout'
import { permalink } from '@/app/lib/permalink'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

type Props = { slug: string }

/**
 * Renders a static page identified by `slug`, using the page's MDX content if found or a 404 fallback otherwise.
 *
 * @param slug - The page slug used to locate `content/pages/{slug}.mdx`
 * @returns A React element that displays the page content when an entry exists, or a 404-style message when not found.
 */
export default function StaticPage({ slug }: Props) {
  const entry = findPost('page', slug)
  useDocumentMeta({
    title: entry?.frontmatter.title ?? slug,
    description: entry?.frontmatter.dek,
  })
  if (!entry) {
    return (
      <article>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          404
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tighter leading-[0.95] text-ink">
          {slug}
        </h1>
        <p className="mt-4 max-w-[44ch] text-base text-ink-muted">
          No page MDX found at{' '}
          <code className="font-mono">content/pages/{slug}.mdx</code>.
        </p>
      </article>
    )
  }
  const { Component, frontmatter } = entry
  return (
    <PostLayout frontmatter={frontmatter} permalink={permalink('page', slug)}>
      <Component />
    </PostLayout>
  )
}

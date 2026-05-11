import { findPost } from '@/app/content-index'
import { PageLayout } from '@/app/post/PageLayout'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

type Props = { slug: string }

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
          No page MDX found at <code className="font-mono">content/pages/{slug}.mdx</code>.
        </p>
      </article>
    )
  }
  return <PageLayout entry={entry} />
}

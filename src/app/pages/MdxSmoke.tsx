import Smoke, { frontmatter } from '@/content/_smoke.mdx'

// Temporary route used to verify the MDX pipeline (commit 7). Removed
// when content-index + slug routing land in commit 10.
export default function MdxSmoke() {
  return (
    <article className="prose-measure">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        smoke · {frontmatter.type ?? 'page'} · {frontmatter.date}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tighter leading-[0.95]">
        {frontmatter.title}
      </h1>
      {frontmatter.dek ? (
        <p className="mt-4 max-w-[44ch] text-base text-ink leading-snug">
          {frontmatter.dek}
        </p>
      ) : null}
      <div className="mt-10 [&_p]:my-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_table]:my-6 [&_table]:text-sm [&_th]:text-left [&_th]:py-1.5 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-rule [&_td]:border-b [&_td]:border-rule/50 [&_th]:pr-6 [&_td]:pr-6">
        <Smoke />
      </div>
    </article>
  )
}

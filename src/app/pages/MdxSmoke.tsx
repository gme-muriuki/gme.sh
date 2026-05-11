import Smoke, { frontmatter } from '@/content/_smoke.mdx'

// Temporary route to verify the MDX pipeline + components (commits 7-8).
// Removed when content-index + slug routing land in commit 10.
export default function MdxSmoke() {
  return (
    <article>
      <header className="mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          smoke · {frontmatter.type ?? 'page'} · {frontmatter.date}
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tighter leading-[0.95] text-ink">
          {frontmatter.title}
        </h1>
        {frontmatter.dek ? (
          <p className="mt-5 max-w-[44ch] text-base text-ink leading-snug">
            {frontmatter.dek}
          </p>
        ) : null}
      </header>
      <div className="prose-essay">
        <Smoke />
      </div>
    </article>
  )
}

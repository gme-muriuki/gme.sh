import { Link } from 'react-router'
import { format } from 'date-fns'
import { postsByType } from '@/app/content-index'
import type { PostEntry } from '@/app/content-index'
import { PostRow } from '@/app/post/PostRow'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

export default function Home() {
  useDocumentMeta({
    description: 'wellformed — Rust, systems, half-baked ideas.',
  })
  const essays = postsByType('essay')
  const notes = postsByType('note')
  const shipped = postsByType('shipped')
  const featured = essays[0]

  if (!featured) {
    return (
      <article>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          home
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tighter leading-[0.95] text-ink max-w-[18ch]">
          Nothing here yet.
        </h1>
        <p className="mt-5 max-w-[44ch] text-base text-ink-muted leading-snug">
          Writing surfaces as it lands. Subscribe via RSS in the meantime.
        </p>
      </article>
    )
  }

  return (
    <div>
      <FeatureTease essay={featured} />
      <section className="mt-24">
        <SectionHeading label="Recent essays" href="/essays" />
        {essays.length > 0 ? (
          <ul className="mt-2">
            {essays.slice(0, 5).map((e) => (
              <PostRow key={e.slug} entry={e} />
            ))}
          </ul>
        ) : (
          <EmptyLine />
        )}
      </section>
      <section className="mt-16">
        <SectionHeading label="Recent notes" href="/notes" />
        {notes.length > 0 ? (
          <ul className="mt-2">
            {notes.slice(0, 5).map((n) => (
              <PostRow key={n.slug} entry={n} />
            ))}
          </ul>
        ) : (
          <EmptyLine />
        )}
      </section>
      <section className="mt-16">
        <SectionHeading label="Recent shipped" href="/shipped" />
        {shipped.length > 0 ? (
          <ul className="mt-2">
            {shipped.slice(0, 5).map((s) => (
              <PostRow key={s.slug} entry={s} />
            ))}
          </ul>
        ) : (
          <EmptyLine />
        )}
      </section>
    </div>
  )
}

function FeatureTease({ essay }: { essay: PostEntry }) {
  const f = essay.frontmatter
  return (
    <article>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        most recent essay
      </p>
      <h1 className="mt-3 text-[2.875rem] font-bold tracking-tighter leading-[0.95] text-ink max-w-[20ch]">
        <Link
          to={`/essays/${essay.slug}`}
          className="no-underline hover:no-underline transition-opacity hover:opacity-85"
        >
          {f.title}
        </Link>
      </h1>
      {f.dek ? (
        <p className="mt-5 max-w-[52ch] text-[1.0625rem] text-ink-muted leading-snug">
          {f.dek}
        </p>
      ) : null}
      <p className="mt-5 flex flex-wrap gap-x-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
        <time dateTime={f.date}>
          {format(new Date(f.date), 'd MMM yyyy')}
        </time>
        {f.type === 'essay' && typeof f.readingTime === 'number' ? (
          <>
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
            <span>{f.readingTime} min</span>
          </>
        ) : null}
      </p>
    </article>
  )
}

function SectionHeading({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule pb-2">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </h2>
      <Link
        to={href}
        className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted hover:text-ink no-underline hover:no-underline transition-colors"
      >
        all &rarr;
      </Link>
    </div>
  )
}

function EmptyLine() {
  return (
    <p className="mt-4 text-sm text-ink-faint italic">None yet.</p>
  )
}

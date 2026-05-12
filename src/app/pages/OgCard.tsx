import { useParams } from 'react-router'
import { format } from 'date-fns'
import { allPosts } from '@/app/content-index'
import { SquareMark } from '@/app/chrome/SquareMark'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

const typeLabels = {
  essay: 'Essay',
  note: 'Note',
  shipped: 'Shipped',
  page: 'Page',
} as const

// Standalone route — no chrome. Renders a 1200×630 card per spec:
// paper background, name in small caps, large serif title, ■, post-type
// tag in brand color. Suitable for screenshotting; production converts
// this via Next.js ImageResponse.
export default function OgCard() {
  const { slug } = useParams<{ slug: string }>()
  const entry = allPosts.find((p) => p.slug === slug)
  const f = entry?.frontmatter
  useDocumentMeta({ title: f?.title ? `OG · ${f.title}` : 'OG card' })

  return (
    <div className="min-h-full w-full flex items-center justify-center bg-[#0f0d0a]/[0.06] py-12 px-4">
      <div
        style={{ width: 1200, height: 630, transform: 'none' }}
        className="bg-paper text-ink relative shadow-[0_30px_80px_rgba(0,0,0,0.15)] flex flex-col p-20 origin-top-left scale-[var(--og-scale,1)] max-w-full"
      >
        {/* corner: wordmark */}
        <div className="flex items-baseline justify-between">
          <p className="wordmark text-2xl text-ink whitespace-nowrap">
            <span>The </span>
            <span className="surname">Recursion</span>
            <span> of Learning</span>
          </p>
          <p className="font-mono text-sm uppercase tracking-[0.22em] text-ink-muted">
            gme.sh
          </p>
        </div>

        {/* center: title + type tag */}
        <div className="flex-1 flex flex-col justify-center">
          <p
            className="font-mono text-base uppercase tracking-[0.25em] mb-6 text-brand font-semibold"
            style={{ fontSize: '20px' }}
          >
            {entry ? typeLabels[entry.type] : 'Not found'}
          </p>
          <h1
            className="font-bold tracking-tighter leading-[0.95] text-ink"
            style={{ fontSize: f ? '88px' : '120px' }}
          >
            {f?.title ?? '404'}
          </h1>
          {f?.dek ? (
            <p className="mt-8 max-w-[44ch] text-2xl text-ink-muted leading-snug">
              {f.dek.length > 140 ? `${f.dek.slice(0, 140)}…` : f.dek}
            </p>
          ) : null}
        </div>

        {/* bottom: ■ + date */}
        <div className="flex items-end justify-between">
          <SquareMark className="text-4xl" />
          {f?.date ? (
            <p className="font-mono text-base uppercase tracking-[0.22em] text-ink-muted">
              {format(new Date(f.date), 'd MMM yyyy')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { publishedPosts } from '@/app/content-index'
import type { PostEntry } from '@/app/content-index'

const SITE_URL = 'https://example.com'
const SITE_TITLE = 'James Muriuki'
const SITE_DESCRIPTION = 'Rust, systems, half-baked ideas.'

const pathPrefix = {
  essay: '/essays',
  note: '/notes',
  shipped: '/shipped',
  page: '/pages',
} as const

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateRss(entries: PostEntry[]): string {
  const items = entries
    .filter((p) => p.type !== 'page')
    .map((p) => {
      const url = `${SITE_URL}${pathPrefix[p.type]}/${p.slug}`
      return `    <item>
      <title>${escapeXml(p.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.frontmatter.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.frontmatter.dek ?? '')}</description>
      <category>${escapeXml(p.type)}</category>
    </item>`
    })
    .join('\n')

  const lastBuild = entries[0]
    ? new Date(entries[0].frontmatter.date).toUTCString()
    : new Date().toUTCString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`
}

export default function RssFeed() {
  const xml = generateRss(publishedPosts)

  useEffect(() => {
    document.title = 'RSS feed — preview'
  }, [])

  return (
    <article>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        rss feed
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-tighter leading-[0.95] text-ink">
        /rss.xml
      </h1>
      <p className="mt-4 max-w-[52ch] text-base text-ink-muted leading-snug">
        Prototype renders the XML inline so it's inspectable in the browser.
        In production (Next.js), this is served as <code className="font-mono">application/rss+xml</code> from a route handler that runs the same{' '}
        <code className="font-mono">generateRss()</code> against the build-time content catalog.
      </p>
      <pre className="mt-10 not-prose overflow-x-auto rounded border border-rule bg-paper-raised/70 p-5 text-[12.5px] font-mono leading-[1.55] text-ink-muted whitespace-pre-wrap break-words">
        {xml}
      </pre>
    </article>
  )
}

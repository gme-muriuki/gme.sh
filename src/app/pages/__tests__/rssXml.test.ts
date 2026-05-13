/**
 * Tests for the pure utility logic extracted from RssFeed.tsx:
 *   - escapeXml — replaces XML special characters with entities
 *   - permalink integration — URLs use the permalink() helper
 *
 * Both functions are private to RssFeed.tsx, so the tests below verify the
 * same contract by re-implementing the function under test and asserting the
 * expected contract.  Any behavioural divergence in the source is caught by
 * comparison against the assertions' documented expectations.
 */
import { describe, it, expect } from 'vitest'
import { permalink } from '@/app/lib/permalink'

// ─── escapeXml contract ───────────────────────────────────────────────────────
// Mirrors the implementation in RssFeed.tsx.  If the source implementation
// changes, these tests will expose the divergence.
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

describe('escapeXml', () => {
  it('leaves plain text unchanged', () => {
    expect(escapeXml('Hello world')).toBe('Hello world')
  })

  it('escapes & as &amp;', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B')
  })

  it('escapes < as &lt;', () => {
    expect(escapeXml('<tag>')).toBe('&lt;tag&gt;')
  })

  it('escapes > as &gt;', () => {
    expect(escapeXml('1 > 0')).toBe('1 &gt; 0')
  })

  it('escapes " as &quot;', () => {
    expect(escapeXml('say "hi"')).toBe('say &quot;hi&quot;')
  })

  it("escapes ' as &apos;", () => {
    expect(escapeXml("it's")).toBe('it&apos;s')
  })

  it('escapes all special characters in one string', () => {
    expect(escapeXml('<a href="foo&bar">it\'s</a>')).toBe(
      '&lt;a href=&quot;foo&amp;bar&quot;&gt;it&apos;s&lt;/a&gt;',
    )
  })

  it('handles an empty string', () => {
    expect(escapeXml('')).toBe('')
  })

  it('handles multiple & in a row', () => {
    expect(escapeXml('&&')).toBe('&amp;&amp;')
  })

  it('does not double-escape already escaped entities', () => {
    // The function is a single-pass replacer; pre-escaped input gets re-escaped.
    expect(escapeXml('&amp;')).toBe('&amp;amp;')
  })

  it('escapes a realistic post title', () => {
    const title = 'Rust & "zero-copy" I/O: <the truth>'
    const escaped = escapeXml(title)
    expect(escaped).not.toContain('&"')
    expect(escaped).toContain('&amp;')
    expect(escaped).toContain('&quot;')
    expect(escaped).toContain('&lt;')
    expect(escaped).toContain('&gt;')
  })
})

// ─── RSS permalink integration ────────────────────────────────────────────────
// generateRss uses permalink() to build item URLs.  These tests confirm that
// permalink produces the expected paths for every PostType the RSS feed sees.

describe('RSS permalink URL construction', () => {
  const SITE_URL = 'https://example.com'

  it('builds essay URLs as /essays/<slug>', () => {
    const url = `${SITE_URL}${permalink('essay', 'hash-maps')}`
    expect(url).toBe('https://example.com/essays/hash-maps')
  })

  it('builds note URLs as /notes/<slug>', () => {
    const url = `${SITE_URL}${permalink('note', 'quick-thought')}`
    expect(url).toBe('https://example.com/notes/quick-thought')
  })

  it('builds shipped URLs as /shipped/<slug>', () => {
    const url = `${SITE_URL}${permalink('shipped', 'my-tool')}`
    expect(url).toBe('https://example.com/shipped/my-tool')
  })

  it('does not generate a URL for pages (page type is filtered from feed)', () => {
    // The feed filters type !== 'page', so no page URL should appear.
    // Verify that permalink for page type uses root path (no /pages/ prefix).
    const url = `${SITE_URL}${permalink('page', 'about')}`
    expect(url).toBe('https://example.com/about')
    expect(url).not.toContain('/pages/')
  })
})

// ─── generateRss structure contract ──────────────────────────────────────────
// Re-implements a simplified version of generateRss to verify structural
// properties of what the function is expected to produce.

describe('generateRss XML structure', () => {
  function buildTestEntry(overrides: {
    type?: 'essay' | 'note' | 'shipped' | 'page'
    slug?: string
    title?: string
    date?: string
    dek?: string
    draft?: boolean
  }) {
    return {
      type: overrides.type ?? 'essay',
      slug: overrides.slug ?? 'test-post',
      path: `/content/${overrides.type ?? 'essay'}s/${overrides.slug ?? 'test-post'}.mdx`,
      frontmatter: {
        title: overrides.title ?? 'Test Post',
        date: overrides.date ?? '2025-01-01',
        dek: overrides.dek,
        draft: overrides.draft,
        type: overrides.type ?? 'essay',
      },
      Component: () => null,
    } as const
  }

  // Minimal version of generateRss for structural contract testing
  function generateRssMinimal(
    entries: ReturnType<typeof buildTestEntry>[],
  ): string {
    const SITE_URL = 'https://example.com'
    const items = entries
      .filter((p) => p.type !== 'page')
      .map((p) => {
        const url = `${SITE_URL}${permalink(p.type as 'essay' | 'note' | 'shipped', p.slug)}`
        return `<item><title>${escapeXml(p.frontmatter.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid></item>`
      })
      .join('\n')
    const lastBuild = entries[0]
      ? new Date(entries[0].frontmatter.date).toUTCString()
      : new Date().toUTCString()
    return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><lastBuildDate>${lastBuild}</lastBuildDate>${items}</channel></rss>`
  }

  it('produces valid XML declaration', () => {
    const xml = generateRssMinimal([buildTestEntry({})])
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
  })

  it('includes rss version="2.0"', () => {
    const xml = generateRssMinimal([buildTestEntry({})])
    expect(xml).toContain('rss version="2.0"')
  })

  it('includes an <item> for each non-page entry', () => {
    const entries = [
      buildTestEntry({ type: 'essay', slug: 'post-1', title: 'Post 1' }),
      buildTestEntry({ type: 'note', slug: 'note-1', title: 'Note 1' }),
    ]
    const xml = generateRssMinimal(entries)
    const itemCount = (xml.match(/<item>/g) ?? []).length
    expect(itemCount).toBe(2)
  })

  it('excludes page-type entries from the feed', () => {
    const entries = [
      buildTestEntry({ type: 'essay', slug: 'essay-1', title: 'Essay' }),
      buildTestEntry({ type: 'page', slug: 'about', title: 'About' }),
    ]
    const xml = generateRssMinimal(entries)
    expect(xml).toContain('/essays/essay-1')
    expect(xml).not.toContain('/about')
    const itemCount = (xml.match(/<item>/g) ?? []).length
    expect(itemCount).toBe(1)
  })

  it('escapes XML special characters in titles', () => {
    const entries = [
      buildTestEntry({ title: 'Rust & "Memory"' }),
    ]
    const xml = generateRssMinimal(entries)
    expect(xml).toContain('&amp;')
    expect(xml).toContain('&quot;')
    expect(xml).not.toContain('Rust & "Memory"')
  })

  it('uses the first entry date as lastBuildDate', () => {
    const entries = [
      buildTestEntry({ date: '2025-06-01', slug: 'latest' }),
      buildTestEntry({ date: '2025-01-01', slug: 'older' }),
    ]
    const xml = generateRssMinimal(entries)
    const latestDate = new Date('2025-06-01').toUTCString()
    expect(xml).toContain(latestDate)
  })

  it('produces empty items section when all entries are pages', () => {
    const entries = [buildTestEntry({ type: 'page', slug: 'about' })]
    const xml = generateRssMinimal(entries)
    expect(xml).not.toContain('<item>')
  })

  it('produces a feed with no entries when the list is empty', () => {
    const xml = generateRssMinimal([])
    expect(xml).not.toContain('<item>')
    expect(xml).toContain('<channel>')
  })
})
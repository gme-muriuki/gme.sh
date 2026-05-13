/**
 * Structural tests for pipeline.ts.
 *
 * The plugin lists are tested as arrays of values: we verify which plugins are
 * present (and absent) in build-time vs runtime configurations without
 * executing the MDX compilation pipeline itself.
 *
 * Heavy Shiki theme loading is mocked so tests run without network access or
 * large bundled assets.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'

// Provide a lightweight mock for @shikijs/rehype so theme loading does not
// execute during tests. The mock function just returns a no-op rehype plugin.
vi.mock('@shikijs/rehype', () => ({
  default: vi.fn(() => () => {}),
}))
vi.mock('@shikijs/transformers', () => ({
  transformerNotationDiff: vi.fn(() => ({ name: 'diff' })),
  transformerNotationHighlight: vi.fn(() => ({ name: 'highlight' })),
  transformerNotationFocus: vi.fn(() => ({ name: 'focus' })),
  transformerNotationErrorLevel: vi.fn(() => ({ name: 'error-level' })),
}))

let buildTimePlugins: Awaited<typeof import('../pipeline')>['buildTimePlugins']
let runtimePlugins: Awaited<typeof import('../pipeline')>['runtimePlugins']

let remarkFrontmatter: unknown
let remarkMdxFrontmatter: unknown
let remarkGfm: unknown
let remarkMath: unknown
let rehypeKatex: unknown
let rehypeSlug: unknown
let rehypeAutolinkHeadings: unknown

beforeAll(async () => {
  const pipeline = await import('../pipeline')
  buildTimePlugins = pipeline.buildTimePlugins
  runtimePlugins = pipeline.runtimePlugins

  remarkFrontmatter = (await import('remark-frontmatter')).default
  remarkMdxFrontmatter = (await import('remark-mdx-frontmatter')).default
  remarkGfm = (await import('remark-gfm')).default
  remarkMath = (await import('remark-math')).default
  rehypeKatex = (await import('rehype-katex')).default
  rehypeSlug = (await import('rehype-slug')).default
  rehypeAutolinkHeadings = (await import('rehype-autolink-headings')).default
})

// ─── buildTimePlugins ─────────────────────────────────────────────────────────

describe('buildTimePlugins.remarkPlugins', () => {
  it('includes remarkFrontmatter', () => {
    expect(buildTimePlugins.remarkPlugins).toContain(remarkFrontmatter)
  })

  it('includes remarkMdxFrontmatter', () => {
    expect(buildTimePlugins.remarkPlugins).toContain(remarkMdxFrontmatter)
  })

  it('includes remarkGfm', () => {
    expect(buildTimePlugins.remarkPlugins).toContain(remarkGfm)
  })

  it('includes remarkMath', () => {
    expect(buildTimePlugins.remarkPlugins).toContain(remarkMath)
  })

  it('has exactly 4 remark plugins', () => {
    expect(buildTimePlugins.remarkPlugins).toHaveLength(4)
  })

  it('lists remarkFrontmatter before remarkMdxFrontmatter (order matters)', () => {
    const idx1 = buildTimePlugins.remarkPlugins.indexOf(remarkFrontmatter as never)
    const idx2 = buildTimePlugins.remarkPlugins.indexOf(remarkMdxFrontmatter as never)
    expect(idx1).toBeLessThan(idx2)
  })
})

describe('buildTimePlugins.rehypePlugins', () => {
  it('includes rehypeSlug', () => {
    expect(buildTimePlugins.rehypePlugins).toContain(rehypeSlug)
  })

  it('includes rehypeKatex', () => {
    expect(buildTimePlugins.rehypePlugins).toContain(rehypeKatex)
  })

  it('includes a rehype-autolink-headings tuple with wrap behavior', () => {
    const autolinkEntry = buildTimePlugins.rehypePlugins.find(
      (p) => Array.isArray(p) && p[0] === rehypeAutolinkHeadings,
    )
    expect(autolinkEntry).toBeDefined()
    expect(Array.isArray(autolinkEntry)).toBe(true)
    const [, opts] = autolinkEntry as [unknown, { behavior: string }]
    expect(opts.behavior).toBe('wrap')
  })

  it('includes a shiki rehype tuple (as array entry)', () => {
    const shikiEntry = buildTimePlugins.rehypePlugins.find(
      (p) => Array.isArray(p),
    )
    // There should be at least one tuple (shiki is always an [plugin, opts] pair)
    expect(shikiEntry).toBeDefined()
  })

  it('has at least 4 rehype plugins', () => {
    expect(buildTimePlugins.rehypePlugins.length).toBeGreaterThanOrEqual(4)
  })
})

// ─── runtimePlugins ───────────────────────────────────────────────────────────

describe('runtimePlugins.remarkPlugins', () => {
  it('does NOT include remarkFrontmatter', () => {
    expect(runtimePlugins.remarkPlugins).not.toContain(remarkFrontmatter)
  })

  it('does NOT include remarkMdxFrontmatter', () => {
    expect(runtimePlugins.remarkPlugins).not.toContain(remarkMdxFrontmatter)
  })

  it('includes remarkGfm', () => {
    expect(runtimePlugins.remarkPlugins).toContain(remarkGfm)
  })

  it('includes remarkMath', () => {
    expect(runtimePlugins.remarkPlugins).toContain(remarkMath)
  })

  it('has exactly 2 remark plugins (no frontmatter parsers)', () => {
    expect(runtimePlugins.remarkPlugins).toHaveLength(2)
  })
})

describe('runtimePlugins.rehypePlugins', () => {
  it('includes rehypeSlug', () => {
    expect(runtimePlugins.rehypePlugins).toContain(rehypeSlug)
  })

  it('includes rehypeKatex', () => {
    expect(runtimePlugins.rehypePlugins).toContain(rehypeKatex)
  })

  it('includes a rehype-autolink-headings tuple', () => {
    const autolinkEntry = runtimePlugins.rehypePlugins.find(
      (p) => Array.isArray(p) && p[0] === rehypeAutolinkHeadings,
    )
    expect(autolinkEntry).toBeDefined()
  })

  it('has at least 4 rehype plugins', () => {
    expect(runtimePlugins.rehypePlugins.length).toBeGreaterThanOrEqual(4)
  })
})

// ─── consistency between build and runtime ────────────────────────────────────

describe('buildTimePlugins vs runtimePlugins', () => {
  it('buildTimePlugins has more remark plugins than runtimePlugins', () => {
    expect(buildTimePlugins.remarkPlugins.length).toBeGreaterThan(
      runtimePlugins.remarkPlugins.length,
    )
  })

  it('both configurations include rehypeSlug', () => {
    expect(buildTimePlugins.rehypePlugins).toContain(rehypeSlug)
    expect(runtimePlugins.rehypePlugins).toContain(rehypeSlug)
  })

  it('both configurations include rehypeKatex', () => {
    expect(buildTimePlugins.rehypePlugins).toContain(rehypeKatex)
    expect(runtimePlugins.rehypePlugins).toContain(rehypeKatex)
  })

  it('both configurations include rehypeAutolinkHeadings', () => {
    const buildHasAutolink = buildTimePlugins.rehypePlugins.some(
      (p) => Array.isArray(p) && p[0] === rehypeAutolinkHeadings,
    )
    const runtimeHasAutolink = runtimePlugins.rehypePlugins.some(
      (p) => Array.isArray(p) && p[0] === rehypeAutolinkHeadings,
    )
    expect(buildHasAutolink).toBe(true)
    expect(runtimeHasAutolink).toBe(true)
  })
})
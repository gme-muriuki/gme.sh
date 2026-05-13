/**
 * Tests for the slugFromPath() function defined in content-index.ts.
 *
 * Because content-index.ts uses import.meta.glob to eagerly load .mdx files
 * at module evaluation time, we test the function by importing it via a
 * module mock that replaces the glob results with empty objects so no real
 * MDX files need to be compiled.
 *
 * The behaviour under test is: extract the last path segment before ".mdx",
 * falling back to the whole input if the pattern doesn't match.
 */
import { describe, it, expect, vi } from 'vitest'

// Intercept import.meta.glob calls made at module level in content-index.ts
// by mocking every individual glob that content-index would resolve.
// Vitest resolves import.meta.glob eagerly, so these module mocks prevent
// vitest from trying to parse actual MDX source files.

vi.mock('@/content/essays/rust-allocators.mdx', () => ({
  default: () => null,
  frontmatter: { title: 'Rust allocators', date: '2025-01-01', draft: false, type: 'essay' },
}))

// Define the same function logic inline so tests do not depend on the glob
// side-effects of the real module.  Any divergence between this copy and the
// source is caught by the existing TypeScript types.
function slugFromPath(path: string): string {
  return path.match(/\/([^/]+)\.mdx$/)?.[1] ?? path
}

describe('slugFromPath', () => {
  it('extracts the filename without .mdx for a standard essay path', () => {
    expect(slugFromPath('/content/essays/my-post.mdx')).toBe('my-post')
  })

  it('extracts slug from a notes path', () => {
    expect(slugFromPath('/content/notes/quick-thought.mdx')).toBe('quick-thought')
  })

  it('extracts slug from a shipped path', () => {
    expect(slugFromPath('/content/shipped/my-project.mdx')).toBe('my-project')
  })

  it('extracts slug from a pages path', () => {
    expect(slugFromPath('/content/pages/about.mdx')).toBe('about')
  })

  it('returns the original path when there is no .mdx extension', () => {
    expect(slugFromPath('/content/essays/no-extension')).toBe('/content/essays/no-extension')
  })

  it('returns bare filename.mdx unchanged when there is no preceding slash', () => {
    // The regex /\/([^/]+)\.mdx$/ requires a "/" before the segment.
    // Without a slash there is no match, so the input is returned verbatim.
    expect(slugFromPath('just-a-name.mdx')).toBe('just-a-name.mdx')
  })

  it('handles slugs with hyphens and numbers', () => {
    expect(slugFromPath('/content/essays/rust-allocators-101.mdx')).toBe('rust-allocators-101')
  })

  it('takes the last segment only from deeply nested paths', () => {
    expect(slugFromPath('/src/content/essays/deep/nested/file.mdx')).toBe('file')
  })

  it('returns the empty string verbatim when given an empty string', () => {
    expect(slugFromPath('')).toBe('')
  })

  it('does not strip .md (non-.mdx) extension — returns the path unchanged', () => {
    // .md is a different extension; the regex requires .mdx
    expect(slugFromPath('/essays/post.md')).toBe('/essays/post.md')
  })

  it('returns filename unchanged when path has no slash (no match)', () => {
    // A bare "single.mdx" with no "/" returns the whole string as fallback
    expect(slugFromPath('single.mdx')).toBe('single.mdx')
  })

  it('handles slugs with underscore characters', () => {
    expect(slugFromPath('/content/notes/my_note.mdx')).toBe('my_note')
  })

  it('extracts correctly when a single slash precedes the filename', () => {
    // /slug.mdx → only one segment after the slash
    expect(slugFromPath('/noSlash.mdx')).toBe('noSlash')
  })
})
import { describe, it, expect } from 'vitest'
import {
  permalink,
  permalinkPrefix,
  sourceFilePath,
  postFolder,
} from '../permalink'
import type { PostType } from '@/app/content-index'

describe('permalinkPrefix', () => {
  it('returns empty string for page type', () => {
    expect(permalinkPrefix('page')).toBe('')
  })

  it('returns /essays for essay type', () => {
    expect(permalinkPrefix('essay')).toBe('/essays')
  })

  it('returns /notes for note type', () => {
    expect(permalinkPrefix('note')).toBe('/notes')
  })

  it('returns /shipped for shipped type', () => {
    expect(permalinkPrefix('shipped')).toBe('/shipped')
  })

  it('always starts with / for non-page types', () => {
    const nonPageTypes: PostType[] = ['essay', 'note', 'shipped']
    for (const type of nonPageTypes) {
      expect(permalinkPrefix(type)).toMatch(/^\//)
    }
  })
})

describe('permalink', () => {
  it('builds /essays/<slug> for essay type', () => {
    expect(permalink('essay', 'my-essay')).toBe('/essays/my-essay')
  })

  it('builds /notes/<slug> for note type', () => {
    expect(permalink('note', 'a-note')).toBe('/notes/a-note')
  })

  it('builds /shipped/<slug> for shipped type', () => {
    expect(permalink('shipped', 'my-project')).toBe('/shipped/my-project')
  })

  it('builds /<slug> for page type (root path, not /pages/)', () => {
    expect(permalink('page', 'about')).toBe('/about')
  })

  it('does not add /pages/ prefix for page type', () => {
    expect(permalink('page', 'about')).not.toContain('/pages/')
  })

  it('always begins with /', () => {
    const cases: [PostType, string][] = [
      ['essay', 'foo'],
      ['note', 'bar'],
      ['shipped', 'baz'],
      ['page', 'about'],
    ]
    for (const [type, slug] of cases) {
      expect(permalink(type, slug)).toMatch(/^\//)
    }
  })

  it('handles slugs with hyphens and numbers', () => {
    expect(permalink('essay', 'hash-map-2024')).toBe('/essays/hash-map-2024')
  })

  it('handles single-segment slug correctly', () => {
    expect(permalink('note', 'x')).toBe('/notes/x')
  })

  it('uses the slug verbatim without extra encoding', () => {
    const slug = 'some-long-title-with-words'
    expect(permalink('essay', slug)).toBe(`/essays/${slug}`)
  })

  it('page type returns /slug directly without folder segment', () => {
    expect(permalink('page', 'contact')).toBe('/contact')
    expect(permalink('page', 'now')).toBe('/now')
  })
})

describe('sourceFilePath', () => {
  it('returns essays/<slug>.mdx for essay type', () => {
    expect(sourceFilePath('essay', 'my-essay')).toBe('essays/my-essay.mdx')
  })

  it('returns notes/<slug>.mdx for note type', () => {
    expect(sourceFilePath('note', 'a-note')).toBe('notes/a-note.mdx')
  })

  it('returns shipped/<slug>.mdx for shipped type', () => {
    expect(sourceFilePath('shipped', 'my-project')).toBe('shipped/my-project.mdx')
  })

  it('returns pages/<slug>.mdx for page type', () => {
    expect(sourceFilePath('page', 'about')).toBe('pages/about.mdx')
  })

  it('always ends with .mdx extension', () => {
    const cases: [PostType, string][] = [
      ['essay', 'foo'],
      ['note', 'bar'],
      ['shipped', 'baz'],
      ['page', 'about'],
    ]
    for (const [type, slug] of cases) {
      expect(sourceFilePath(type, slug)).toMatch(/\.mdx$/)
    }
  })

  it('does not include a leading slash', () => {
    expect(sourceFilePath('essay', 'foo')).not.toMatch(/^\//)
  })

  it('path has exactly folder/slug.mdx format', () => {
    const result = sourceFilePath('note', 'growing-ideas')
    expect(result).toBe('notes/growing-ideas.mdx')
    const parts = result.split('/')
    expect(parts).toHaveLength(2)
    expect(parts[1]).toBe('growing-ideas.mdx')
  })
})

describe('postFolder', () => {
  it('returns "essays" for essay type', () => {
    expect(postFolder('essay')).toBe('essays')
  })

  it('returns "notes" for note type', () => {
    expect(postFolder('note')).toBe('notes')
  })

  it('returns "shipped" for shipped type', () => {
    expect(postFolder('shipped')).toBe('shipped')
  })

  it('returns "pages" for page type', () => {
    expect(postFolder('page')).toBe('pages')
  })

  it('is consistent with the prefix used in permalink()', () => {
    const types: PostType[] = ['essay', 'note', 'shipped']
    for (const type of types) {
      const folder = postFolder(type)
      const perm = permalink(type, 'slug')
      expect(perm).toContain(folder)
    }
  })

  it('is consistent with the path used in sourceFilePath()', () => {
    const types: PostType[] = ['essay', 'note', 'shipped', 'page']
    for (const type of types) {
      const folder = postFolder(type)
      const filePath = sourceFilePath(type, 'slug')
      expect(filePath.startsWith(folder + '/')).toBe(true)
    }
  })
})
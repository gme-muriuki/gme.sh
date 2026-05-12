import type { ReactNode } from 'react'
import type { Frontmatter, RawMdxFrontmatter } from '*.mdx'
import type { PostType } from '@/app/content-index'
import { EssayLayout } from './EssayLayout'
import { NoteLayout } from './NoteLayout'
import { ShippedLayout } from './ShippedLayout'
import { PageLayout } from './PageLayout'

type Props = {
  frontmatter: Frontmatter
  permalink: string
  children: ReactNode
}

/**
 * Single seam between a post and its visual layout. Narrows on
 * `frontmatter.type` and delegates to the type-specific layout
 * component. Adding a new post type means adding a layout and one
 * case here — callers (PostPage, /write Preview) do not change.
 */
export function PostLayout({ frontmatter: f, permalink, children }: Props) {
  switch (f.type) {
    case 'essay':
      return (
        <EssayLayout frontmatter={f} permalink={permalink}>
          {children}
        </EssayLayout>
      )
    case 'note':
      return (
        <NoteLayout frontmatter={f} permalink={permalink}>
          {children}
        </NoteLayout>
      )
    case 'shipped':
      return (
        <ShippedLayout frontmatter={f} permalink={permalink}>
          {children}
        </ShippedLayout>
      )
    case 'page':
      return <PageLayout frontmatter={f}>{children}</PageLayout>
  }
}

/**
 * Combine a known post type with a loose, possibly-incomplete set of
 * frontmatter fields into a fully-typed Frontmatter. Used by /write,
 * where the type comes from UI state and the fields from the editor
 * source. Fills sane defaults for required base fields.
 */
export function combineFrontmatter(
  type: PostType,
  fields: Partial<RawMdxFrontmatter>,
): Frontmatter {
  const today = new Date().toISOString().slice(0, 10)
  return {
    type,
    title: fields.title ?? 'Untitled',
    date: fields.date ?? today,
    dek: fields.dek,
    tags: fields.tags,
    draft: fields.draft,
    ogImage: fields.ogImage,
    ogDescription: fields.ogDescription,
    readingTime: fields.readingTime,
    series: fields.series,
    growth: fields.growth,
    lastTended: fields.lastTended,
    hero: fields.hero,
    links: fields.links,
  } as Frontmatter
}

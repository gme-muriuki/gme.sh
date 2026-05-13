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
 * Selects and renders the layout component corresponding to a post's `frontmatter.type`.
 *
 * Delegates rendering to the appropriate type-specific layout and places `children` inside it.
 *
 * @param frontmatter - The post's frontmatter used to determine and supply data to the chosen layout
 * @param permalink - The post's permalink, forwarded to layouts that require it
 * @param children - Rendered post content passed into the selected layout
 * @returns A React element for the selected post layout
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
 * Create a fully-populated Frontmatter object for a given post type by applying defaults to missing editor-provided fields.
 *
 * @param type - The post `type` to assign to the resulting frontmatter.
 * @param fields - Partial frontmatter values from the editor; missing `title` and `date` will be filled with defaults.
 * @returns A `Frontmatter` object with `type` set to `type`, `title` defaulting to `"Untitled"` when absent, `date` defaulting to today's date in `YYYY-MM-DD` format, and all other optional fields copied from `fields`.
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
    relations: fields.relations,
    readingTime: fields.readingTime,
    series: fields.series,
    growth: fields.growth,
    lastTended: fields.lastTended,
    hero: fields.hero,
    links: fields.links,
  } as Frontmatter
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'

  type BaseFrontmatter = {
    title: string
    date: string
    dek?: string
    tags?: string[]
    draft?: boolean
    ogImage?: string
    ogDescription?: string
  }

  export type EssayFrontmatter = BaseFrontmatter & {
    type: 'essay'
    readingTime?: number
    series?: { name: string; index: number; total: number }
  }

  export type NoteFrontmatter = BaseFrontmatter & {
    type: 'note'
    growth?: 'seedling' | 'growing' | 'evergreen'
    lastTended?: string
  }

  export type ShippedFrontmatter = BaseFrontmatter & {
    type: 'shipped'
    hero?: string
    links?: { label: string; href: string }[]
  }

  export type PageFrontmatter = BaseFrontmatter & {
    type: 'page'
  }

  /**
   * The typed, narrow-able shape of a post's frontmatter. Discriminated on
   * `type`, which is injected by content-index from the source folder
   * (`essays/` -> 'essay', etc.). MDX files themselves don't carry `type`
   * in their YAML; see `RawMdxFrontmatter` for what the compiled module
   * actually exports.
   */
  export type Frontmatter =
    | EssayFrontmatter
    | NoteFrontmatter
    | ShippedFrontmatter
    | PageFrontmatter

  /**
   * The flat, loose shape of what `@mdx-js/rollup`'s
   * `remark-mdx-frontmatter` plugin exports from the compiled module. No
   * `type` discriminator — that's added at content-index time. All
   * variant-specific fields are optional; consumers should narrow via
   * Frontmatter (with `type`) for type-safe access.
   */
  export type RawMdxFrontmatter = BaseFrontmatter & {
    readingTime?: number
    series?: { name: string; index: number; total: number }
    growth?: 'seedling' | 'growing' | 'evergreen'
    lastTended?: string
    hero?: string
    links?: { label: string; href: string }[]
  }

  export const frontmatter: RawMdxFrontmatter

  const MDXComponent: ComponentType
  export default MDXComponent
}

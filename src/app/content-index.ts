import type { ComponentType } from 'react'
import type { Frontmatter, RawMdxFrontmatter } from '*.mdx'

type Mod = {
  default: ComponentType
  frontmatter: RawMdxFrontmatter
}

export type PostType = 'essay' | 'note' | 'shipped' | 'page'

export type PostEntry = {
  slug: string
  type: PostType
  path: string
  frontmatter: Frontmatter
  Component: ComponentType
}

const essayMods = import.meta.glob<Mod>('@/content/essays/*.mdx', {
  eager: true,
})
const noteMods = import.meta.glob<Mod>('@/content/notes/*.mdx', {
  eager: true,
})
const shippedMods = import.meta.glob<Mod>('@/content/shipped/*.mdx', {
  eager: true,
})
const pageMods = import.meta.glob<Mod>('@/content/pages/*.mdx', {
  eager: true,
})

function slugFromPath(path: string): string {
  return path.match(/\/([^/]+)\.mdx$/)?.[1] ?? path
}

function buildEntries(
  mods: Record<string, Mod>,
  type: PostType,
): PostEntry[] {
  return Object.entries(mods).map(([path, mod]) => ({
    slug: slugFromPath(path),
    type,
    path,
    // The YAML in the file has no `type`; inject from the folder mapping.
    // The cast is safe at the boundary — variant-specific fields that the
    // file did not declare stay `undefined` and the discriminated union
    // narrows correctly for downstream consumers.
    frontmatter: { ...mod.frontmatter, type } as Frontmatter,
    Component: mod.default,
  }))
}

export const allPosts: PostEntry[] = [
  ...buildEntries(essayMods, 'essay'),
  ...buildEntries(noteMods, 'note'),
  ...buildEntries(shippedMods, 'shipped'),
  ...buildEntries(pageMods, 'page'),
].sort((a, b) => (a.frontmatter.date > b.frontmatter.date ? -1 : 1))

export const publishedPosts: PostEntry[] = allPosts.filter(
  (p) => p.frontmatter.draft !== true,
)

export function findPost(
  type: PostType,
  slug: string,
): PostEntry | undefined {
  return allPosts.find((p) => p.type === type && p.slug === slug)
}

export function postsByType(type: PostType): PostEntry[] {
  return publishedPosts.filter((p) => p.type === type)
}

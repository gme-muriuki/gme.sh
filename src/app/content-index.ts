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

/**
 * Extracts the filename (slug) without the `.mdx` extension from an MDX module path.
 *
 * @param path - The module path for an MDX file (for example `/content/essays/foo.mdx`).
 * @returns The filename portion of `path` without the `.mdx` extension (for example `foo`), or `path` if a slug cannot be extracted.
 */
export function slugFromPath(path: string): string {
  return path.match(/\/([^/]+)\.mdx$/)?.[1] ?? path
}

/**
 * Convert a record of imported MDX modules into an array of `PostEntry` objects for the specified post type.
 *
 * The returned entries have `slug` derived from each module path and `frontmatter.type` injected with the provided `type`.
 *
 * @param mods - Record mapping module file paths to their imported module (`Mod`)
 * @param type - The `PostType` to assign to every resulting entry
 * @returns An array of `PostEntry` constructed from the provided modules
 */
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

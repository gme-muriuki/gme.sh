import type { PostType } from '@/app/content-index'

const FOLDER: Record<PostType, string> = {
  essay: 'essays',
  note: 'notes',
  shipped: 'shipped',
  page: 'pages',
}

/**
 * Compute the URL path prefix for a post type.
 *
 * @param type - The post type to build the prefix for.
 * @returns `''` for `page` (root path), otherwise the folder prefix beginning with `/` (for example `/essays`)
 */
export function permalinkPrefix(type: PostType): string {
  // public route for pages lives at the root (/about, not /pages/about)
  return type === 'page' ? '' : `/${FOLDER[type]}`
}

/**
 * Builds the public URL path for a post given its type and slug.
 *
 * @param type - The post type determining the URL namespace (e.g., `essay`, `note`, `shipped`, `page`)
 * @param slug - The post's slug (path segment) without leading or trailing slashes
 * @returns The permalink path for the post, beginning with a leading slash (for example `/essays/my-post` or `/about`)
 */
export function permalink(type: PostType, slug: string): string {
  if (type === 'page') return `/${slug}`
  return `/${FOLDER[type]}/${slug}`
}

// disk path for a post source file, sans `src/content/`
/**
 * Computes the relative disk path (under `src/content/`) to a post's `.mdx` source file.
 *
 * @param type - The post type determining its folder (e.g., `essay`, `note`, `shipped`, `page`)
 * @param slug - The post slug (file name without extension)
 * @returns The relative path in the form `folder/slug.mdx`
 */
export function sourceFilePath(type: PostType, slug: string): string {
  return `${FOLDER[type]}/${slug}.mdx`
}

/**
 * Get the content folder name for a given post type.
 *
 * @param type - The post type to map to a folder
 * @returns The folder name corresponding to `type` (for example: "essays", "notes", "shipped", "pages")
 */
export function postFolder(type: PostType): string {
  return FOLDER[type]
}

import type { PostType } from '@/app/content-index'

const FOLDER: Record<PostType, string> = {
  essay: 'essays',
  note: 'notes',
  shipped: 'shipped',
  page: 'pages',
}

export function permalinkPrefix(type: PostType): string {
  // public route for pages lives at the root (/about, not /pages/about)
  return type === 'page' ? '' : `/${FOLDER[type]}`
}

export function permalink(type: PostType, slug: string): string {
  if (type === 'page') return `/${slug}`
  return `/${FOLDER[type]}/${slug}`
}

// disk path for a post source file, sans `src/content/`
// e.g. essays/hash-map-allocator.mdx
export function sourceFilePath(type: PostType, slug: string): string {
  return `${FOLDER[type]}/${slug}.mdx`
}

export function postFolder(type: PostType): string {
  return FOLDER[type]
}

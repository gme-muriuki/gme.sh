import type { PostType } from '@/app/content-index'

const essayRaw = import.meta.glob<string>('@/content/essays/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const noteRaw = import.meta.glob<string>('@/content/notes/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const shippedRaw = import.meta.glob<string>('@/content/shipped/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const pageRaw = import.meta.glob<string>('@/content/pages/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function slugFromPath(p: string): string {
  return p.match(/\/([^/]+)\.mdx$/)?.[1] ?? p
}

function build(mods: Record<string, string>, type: PostType): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [path, raw] of Object.entries(mods)) {
    out[`${type}/${slugFromPath(path)}`] = raw
  }
  return out
}

export type SourceKey = `${PostType}/${string}`

export const SOURCES: Record<string, string> = {
  ...build(essayRaw, 'essay'),
  ...build(noteRaw, 'note'),
  ...build(shippedRaw, 'shipped'),
  ...build(pageRaw, 'page'),
}

export const SOURCE_INDEX: Record<PostType, string[]> = (() => {
  const idx: Record<PostType, string[]> = {
    essay: [],
    note: [],
    shipped: [],
    page: [],
  }
  for (const key of Object.keys(SOURCES)) {
    const [type, slug] = key.split('/', 2) as [PostType, string]
    idx[type].push(slug)
  }
  for (const arr of Object.values(idx)) arr.sort()
  return idx
})()

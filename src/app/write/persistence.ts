import type { PostType } from '@/app/content-index'

export type SaveResult =
  | { ok: true; path: string }
  | { ok: false; error: string }
export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string }
export type SnapshotResult =
  | { ok: true; timestamp: string }
  | { ok: false; error: string }
export type SnapshotList =
  | { ok: true; snapshots: string[] }
  | { ok: false; error: string }
export type SnapshotLoad =
  | { ok: true; source: string }
  | { ok: false; error: string }

const PROD_ERROR = 'persistence-disabled-in-prod'

export const persistenceAvailable: boolean = import.meta.env.DEV

async function readJson<T>(r: Response): Promise<T> {
  try {
    return (await r.json()) as T
  } catch {
    return { ok: false, error: `bad-response-${r.status}` } as T
  }
}

export async function saveSource(
  type: PostType,
  slug: string,
  source: string,
): Promise<SaveResult> {
  if (!persistenceAvailable) return { ok: false, error: PROD_ERROR }
  const r = await fetch('/api/write/source', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, slug, source }),
  })
  return readJson<SaveResult>(r)
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

function extFromFile(file: File): string {
  const name = file.name ?? ''
  const dot = name.lastIndexOf('.')
  if (dot >= 0 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase()
  return MIME_TO_EXT[file.type] ?? 'png'
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!persistenceAvailable) return { ok: false, error: PROD_ERROR }
  const r = await fetch('/api/write/upload', {
    method: 'POST',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'x-image-ext': extFromFile(file),
    },
    body: file,
  })
  return readJson<UploadResult>(r)
}

export async function createSnapshot(
  type: PostType,
  slug: string,
  source: string,
): Promise<SnapshotResult> {
  if (!persistenceAvailable) return { ok: false, error: PROD_ERROR }
  const r = await fetch('/api/write/snapshot', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, slug, source }),
  })
  return readJson<SnapshotResult>(r)
}

export async function listSnapshots(
  type: PostType,
  slug: string,
): Promise<SnapshotList> {
  if (!persistenceAvailable) return { ok: true, snapshots: [] }
  const r = await fetch(
    `/api/write/snapshots/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`,
  )
  return readJson<SnapshotList>(r)
}

export async function loadSnapshot(
  type: PostType,
  slug: string,
  timestamp: string,
): Promise<SnapshotLoad> {
  if (!persistenceAvailable) return { ok: false, error: PROD_ERROR }
  const r = await fetch(
    `/api/write/snapshots/${encodeURIComponent(type)}/${encodeURIComponent(slug)}/${encodeURIComponent(timestamp)}`,
  )
  return readJson<SnapshotLoad>(r)
}

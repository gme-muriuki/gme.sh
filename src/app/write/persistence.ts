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

/**
 * Parse an HTTP Response body as JSON, falling back to a standardized error object when parsing fails.
 *
 * @param r - The Response whose body should be parsed as JSON
 * @returns The parsed JSON cast to `T`, or an object `{ ok: false, error: \`bad-response-<status>\` }` cast to `T` if JSON parsing fails
 */
async function readJson<T>(r: Response): Promise<T> {
  try {
    return (await r.json()) as T
  } catch {
    return { ok: false, error: `bad-response-${r.status}` } as T
  }
}

/**
 * Save a post's source content via the server persistence API.
 *
 * @param type - The post type (e.g., `post`, `page`) identifying content namespace
 * @param slug - The post's slug used as an identifier/path segment
 * @param source - The raw source content to save
 * @returns A `SaveResult` indicating success with the saved `path`, or failure with an `error` string. If persistence is disabled in production, returns a failure with error `persistence-disabled-in-prod`.
 */
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

/**
 * Infer a file extension from a File's name or MIME type.
 *
 * @param file - The File object to inspect
 * @returns The inferred extension in lowercase; falls back to a MIME-derived extension or `'png'` if none can be determined
 */
function extFromFile(file: File): string {
  const name = file.name ?? ''
  const dot = name.lastIndexOf('.')
  if (dot >= 0 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase()
  return MIME_TO_EXT[file.type] ?? 'png'
}

/**
 * Uploads an image file to the server and returns the resulting upload information.
 *
 * @param file - The image file to upload
 * @returns An object: `{ ok: true; url: string }` on success, or `{ ok: false; error: string }` on failure
 */
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

/**
 * Creates a timestamped snapshot of the provided source for the specified post.
 *
 * @param type - Post type identifier (for example `"post"` or `"page"`)
 * @param slug - Post slug used to identify the resource
 * @param source - Source content to store in the snapshot
 * @returns On success, `{ ok: true, timestamp: string }`; on failure, `{ ok: false, error: string }`
 */
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

/**
 * Fetches the list of snapshot timestamps for a post.
 *
 * If persistence is disabled, returns an empty snapshot list.
 *
 * @param type - The post type identifier
 * @param slug - The post slug
 * @returns `{ ok: true, snapshots: string[] }` on success, `{ ok: false, error: string }` on failure
 */
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

/**
 * Load a saved snapshot for a post identified by its type, slug, and timestamp.
 *
 * @param type - The post type (e.g., "post" or "page")
 * @param slug - The post's slug identifier
 * @param timestamp - The snapshot timestamp identifier (as produced by `createSnapshot`)
 * @returns The snapshot load result: on success `{ ok: true, source }`; on failure `{ ok: false, error }`
 */
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

export type GithubCitation =
  | {
      ok: true
      content: string
      lang: string
      owner: string
      repo: string
      ref: string
      path: string
      startLine: number
      endLine: number
      truncated: boolean
    }
  | { ok: false; error: string }

/**
 * Fetches citation metadata for a GitHub blob URL.
 *
 * @param url - The GitHub blob URL to cite; may include a line fragment (`#L<start>` or `#L<start>-L<end>`)
 * @returns A `GithubCitation` result: on success contains citation fields (`content`, `lang`, `owner`, `repo`, `ref`, `path`, `startLine`, `endLine`, `truncated`); on failure `{ ok: false, error: string }`
 */
export async function fetchGithub(url: string): Promise<GithubCitation> {
  if (!persistenceAvailable) return { ok: false, error: PROD_ERROR }
  const r = await fetch(
    `/api/write/github?url=${encodeURIComponent(url)}`,
  )
  return readJson<GithubCitation>(r)
}

export const GITHUB_BLOB_RE =
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\/[\w./-]+(?:#L\d+(?:-L\d+)?)?$/

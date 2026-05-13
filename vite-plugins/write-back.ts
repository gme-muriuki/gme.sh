import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const POST_TYPES = ['essay', 'note', 'shipped', 'page'] as const
type PostType = (typeof POST_TYPES)[number]

const FOLDER: Record<PostType, string> = {
  essay: 'essays',
  note: 'notes',
  shipped: 'shipped',
  page: 'pages',
}

const SLUG_RE = /^[a-z0-9-]+$/
const STAMP_RE = /^[0-9TZ.-]+$/
const IMAGE_EXT_RE = /^(png|jpe?g|gif|webp|avif|svg)$/i

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

/**
 * Determines whether a string is a valid post type.
 *
 * @param s - Candidate post type string
 * @returns `true` if `s` matches one of the allowed post types (`'essay'`, `'note'`, `'shipped'`, `'page'`), `false` otherwise.
 */
function isPostType(s: string): s is PostType {
  return (POST_TYPES as readonly string[]).includes(s)
}

/**
 * Determines whether `child` is located strictly inside the `parent` directory.
 *
 * @param parent - Path of the parent directory
 * @param child - Path to test for containment within `parent`
 * @returns `true` if `child` is a nested path beneath `parent`, `false` otherwise.
 */
function isInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child)
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

/**
 * Collects the entire request body stream and returns it as a single Buffer.
 *
 * @returns A `Buffer` containing the full request body
 */
async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

/**
 * Reads the entire request body and parses it as JSON.
 *
 * @returns The parsed JSON value.
 * @throws {SyntaxError} If the request body is not valid JSON.
 */
async function readJson<T>(req: IncomingMessage): Promise<T> {
  const buf = await readBody(req)
  return JSON.parse(buf.toString('utf-8')) as T
}

/**
 * Send `body` as a JSON response with the specified HTTP status code and JSON content type.
 *
 * @param res - The server response to write to
 * @param status - HTTP status code to set on the response
 * @param body - Value to serialize as JSON into the response body
 */
function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/**
 * Determines whether a request URL targets the root path.
 *
 * @param url - The request URL string or `undefined`; `undefined` is treated as the root.
 * @returns `true` if `url` is `'/'`, `''`, or `undefined`, `false` otherwise.
 */
function isRootPath(url: string | undefined): boolean {
  return url === '/' || url === '' || url === undefined
}

/**
 * Map a Content-Type MIME string to a common file extension.
 *
 * Parses the MIME type (ignoring any `;` parameters) and returns the corresponding file extension.
 *
 * @param mime - MIME type or `Content-Type` header value (may include parameters like `charset`)
 * @returns The mapped extension (for example, `png`) or `undefined` if the MIME type is not recognized
 */
function extFromMime(mime: string): string | undefined {
  const m = mime.split(';')[0]?.trim().toLowerCase()
  return m ? MIME_TO_EXT[m] : undefined
}

type GithubBlob = {
  owner: string
  repo: string
  ref: string
  path: string
  startLine?: number
  endLine?: number
}

/**
 * Parses a GitHub "blob" URL and extracts owner, repository, ref, file path, and optional line range.
 *
 * @param raw - The URL string to parse (expected form: `https://github.com/:owner/:repo/blob/:ref/:path[#Lstart[-Lend]]`)
 * @returns An object with `owner`, `repo`, `ref`, `path`, and optional `startLine`/`endLine` when the URL fragment is `#L<start>` or `#L<start>-L<end>`, or `null` if `raw` is not a valid GitHub blob URL.
 */
function parseGithubBlobUrl(raw: string): GithubBlob | null {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.hostname !== 'github.com') return null
  const parts = u.pathname.split('/').filter(Boolean)
  if (parts.length < 5 || parts[2] !== 'blob') return null
  const owner = parts[0]
  const repo = parts[1]
  const ref = parts[3]
  if (!owner || !repo || !ref) return null
  const path = parts.slice(4).join('/')
  if (!path) return null
  const m = u.hash.match(/^#L(\d+)(?:-L(\d+))?$/)
  return {
    owner,
    repo,
    ref,
    path,
    startLine: m ? Number(m[1]) : undefined,
    endLine: m && m[2] ? Number(m[2]) : m ? Number(m[1]) : undefined,
  }
}

const EXT_TO_LANG: Record<string, string> = {
  rs: 'rust',
  ts: 'ts',
  tsx: 'tsx',
  js: 'js',
  jsx: 'jsx',
  py: 'python',
  go: 'go',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  cpp: 'cpp',
  cc: 'cpp',
  java: 'java',
  kt: 'kotlin',
  rb: 'ruby',
  php: 'php',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  json: 'json',
  md: 'markdown',
  mdx: 'mdx',
  css: 'css',
  scss: 'scss',
  html: 'html',
  sql: 'sql',
  lua: 'lua',
  swift: 'swift',
  zig: 'zig',
}

/**
 * Infers a language identifier from a file path or filename extension.
 *
 * @param path - File path or filename to inspect
 * @returns The mapped language identifier for the extension, or `text` if no mapping exists
 */
function langFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_LANG[ext] ?? 'text'
}

// Hard cap to keep an accidental paste of a 50k-line file from filling
// the doc. 400 lines is well past anything legibly cited.
const MAX_CITATION_LINES = 400

/**
 * Register a Vite dev-only plugin that exposes /api/write/* endpoints for writing and reading content, images, snapshots, and fetching GitHub blob excerpts.
 *
 * The plugin is applied only in the development server (apply: 'serve') and mounts multiple middleware routes under /api/write to validate inputs, perform safe filesystem writes/reads, and return structured JSON responses.
 *
 * @returns The Vite plugin instance configured with these development-only write-back endpoints.
 */
export function writeBack(): Plugin {
  return {
    name: 'write-back',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root
      const contentRoot = path.resolve(root, 'src/content')
      const imagesRoot = path.resolve(root, 'public/images')
      const historyRoot = path.resolve(root, '.write-history')

      server.middlewares.use('/api/write/source', async (req, res, next) => {
        if (req.method !== 'POST' || !isRootPath(req.url)) return next()
        try {
          const body = await readJson<{
            type?: string
            slug?: string
            source?: string
          }>(req)
          const { type, slug, source } = body
          if (!type || !isPostType(type))
            return send(res, 400, { ok: false, error: 'bad-type' })
          if (!slug || !SLUG_RE.test(slug))
            return send(res, 400, { ok: false, error: 'bad-slug' })
          if (typeof source !== 'string')
            return send(res, 400, { ok: false, error: 'bad-source' })

          const target = path.resolve(
            contentRoot,
            FOLDER[type],
            `${slug}.mdx`,
          )
          if (!isInside(contentRoot, target))
            return send(res, 400, { ok: false, error: 'path-escape' })

          await mkdir(path.dirname(target), { recursive: true })
          await writeFile(target, source, 'utf-8')
          const rel = path.relative(root, target).replaceAll('\\', '/')
          send(res, 200, { ok: true, path: rel })
        } catch (err) {
          send(res, 500, { ok: false, error: (err as Error).message })
        }
      })

      server.middlewares.use('/api/write/upload', async (req, res, next) => {
        if (req.method !== 'POST' || !isRootPath(req.url)) return next()
        try {
          const contentType = (req.headers['content-type'] ?? '').toString()
          const extHeader = (req.headers['x-image-ext'] ?? '')
            .toString()
            .replace(/^\./, '')
          const ext = (extHeader || extFromMime(contentType) || '').toLowerCase()
          if (!ext || !IMAGE_EXT_RE.test(ext))
            return send(res, 400, { ok: false, error: 'bad-ext' })

          const body = await readBody(req)
          if (body.length === 0)
            return send(res, 400, { ok: false, error: 'empty' })

          const hash = createHash('sha256')
            .update(body)
            .digest('hex')
            .slice(0, 16)
          await mkdir(imagesRoot, { recursive: true })
          const target = path.resolve(imagesRoot, `${hash}.${ext}`)
          if (!isInside(imagesRoot, target))
            return send(res, 400, { ok: false, error: 'path-escape' })

          await writeFile(target, body)
          send(res, 200, { ok: true, url: `/images/${hash}.${ext}` })
        } catch (err) {
          send(res, 500, { ok: false, error: (err as Error).message })
        }
      })

      server.middlewares.use('/api/write/snapshot', async (req, res, next) => {
        if (req.method !== 'POST' || !isRootPath(req.url)) return next()
        try {
          const body = await readJson<{
            type?: string
            slug?: string
            source?: string
          }>(req)
          const { type, slug, source } = body
          if (!type || !isPostType(type))
            return send(res, 400, { ok: false, error: 'bad-type' })
          if (!slug || !SLUG_RE.test(slug))
            return send(res, 400, { ok: false, error: 'bad-slug' })
          if (typeof source !== 'string')
            return send(res, 400, { ok: false, error: 'bad-source' })

          const folder = path.resolve(historyRoot, `${type}-${slug}`)
          if (!isInside(historyRoot, folder))
            return send(res, 400, { ok: false, error: 'path-escape' })

          const stamp = new Date().toISOString().replaceAll(':', '-')
          const target = path.resolve(folder, `${stamp}.mdx`)
          if (!isInside(historyRoot, target))
            return send(res, 400, { ok: false, error: 'path-escape' })

          await mkdir(folder, { recursive: true })
          await writeFile(target, source, 'utf-8')
          send(res, 200, { ok: true, timestamp: stamp })
        } catch (err) {
          send(res, 500, { ok: false, error: (err as Error).message })
        }
      })

      server.middlewares.use('/api/write/github', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        try {
          const url = new URL(req.url ?? '/', 'http://x').searchParams.get(
            'url',
          )
          if (!url) return send(res, 400, { ok: false, error: 'no-url' })
          const parsed = parseGithubBlobUrl(url)
          if (!parsed) return send(res, 400, { ok: false, error: 'bad-url' })

          const raw = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.ref}/${parsed.path}`
          const r = await fetch(raw)
          if (!r.ok) {
            return send(res, 502, {
              ok: false,
              error: `github-fetch-${r.status}`,
            })
          }
          const text = await r.text()
          const lines = text.split('\n')
          const start = parsed.startLine ?? 1
          const requestedEnd = parsed.endLine ?? lines.length
          const end = Math.min(requestedEnd, start + MAX_CITATION_LINES - 1)
          const content = lines.slice(start - 1, end).join('\n')
          send(res, 200, {
            ok: true,
            content,
            lang: langFromPath(parsed.path),
            owner: parsed.owner,
            repo: parsed.repo,
            ref: parsed.ref,
            path: parsed.path,
            startLine: start,
            endLine: end,
            truncated: end < requestedEnd,
          })
        } catch (err) {
          send(res, 500, { ok: false, error: (err as Error).message })
        }
      })

      server.middlewares.use(
        '/api/write/snapshots',
        async (req, res, next) => {
          if (req.method !== 'GET') return next()
          try {
            const parts = (req.url ?? '/').split('/').filter(Boolean)
            const [type, slug, stamp] = parts
            if (!type || !isPostType(type))
              return send(res, 400, { ok: false, error: 'bad-type' })
            if (!slug || !SLUG_RE.test(slug))
              return send(res, 400, { ok: false, error: 'bad-slug' })

            const folder = path.resolve(historyRoot, `${type}-${slug}`)
            if (!isInside(historyRoot, folder))
              return send(res, 400, { ok: false, error: 'path-escape' })

            if (parts.length === 2) {
              let entries: string[]
              try {
                entries = await readdir(folder)
              } catch {
                entries = []
              }
              const snapshots = entries
                .filter((n) => n.endsWith('.mdx'))
                .map((n) => n.replace(/\.mdx$/, ''))
                .sort()
                .reverse()
              return send(res, 200, { ok: true, snapshots })
            }

            if (parts.length === 3) {
              if (!stamp || !STAMP_RE.test(stamp))
                return send(res, 400, { ok: false, error: 'bad-stamp' })
              const target = path.resolve(folder, `${stamp}.mdx`)
              if (!isInside(historyRoot, target))
                return send(res, 400, { ok: false, error: 'path-escape' })
              try {
                const source = await readFile(target, 'utf-8')
                return send(res, 200, { ok: true, source })
              } catch {
                return send(res, 404, { ok: false, error: 'not-found' })
              }
            }

            return send(res, 400, { ok: false, error: 'bad-path' })
          } catch (err) {
            send(res, 500, { ok: false, error: (err as Error).message })
          }
        },
      )
    },
  }
}

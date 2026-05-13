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

function isPostType(s: string): s is PostType {
  return (POST_TYPES as readonly string[]).includes(s)
}

function isInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child)
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const buf = await readBody(req)
  return JSON.parse(buf.toString('utf-8')) as T
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function isRootPath(url: string | undefined): boolean {
  return url === '/' || url === '' || url === undefined
}

function extFromMime(mime: string): string | undefined {
  const m = mime.split(';')[0]?.trim().toLowerCase()
  return m ? MIME_TO_EXT[m] : undefined
}

/**
 * Dev-only write-back endpoints for /write.
 *
 * - POST /api/write/source              { type, slug, source }       -> { ok, path }
 * - POST /api/write/upload              raw image body + ext header  -> { ok, url }
 * - POST /api/write/snapshot            { type, slug, source }       -> { ok, timestamp }
 * - GET  /api/write/snapshots/:t/:s                                  -> { ok, snapshots }
 * - GET  /api/write/snapshots/:t/:s/:ts                              -> { ok, source }
 *
 * `apply: 'serve'` keeps the plugin out of `vite build`, so production
 * never gains a write surface. When the app ports to Next.js, these
 * endpoints become route handlers / server actions and this file is
 * deleted.
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

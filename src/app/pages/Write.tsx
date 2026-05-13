import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { format } from 'date-fns'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'
import { useMdxEval } from '@/app/hooks/useMdxEval'
import { useMediaQuery } from '@/app/hooks/useMediaQuery'
import { cn } from '@/app/lib/cn'
import { ConfirmDialog, SidePanelDrawer } from '@/app/lib/dialogs'
import { Toolbar } from '@/app/write/Toolbar'
import { Sidebar } from '@/app/write/Sidebar'
import { MetaPanel } from '@/app/write/MetaPanel'
import { Preview } from '@/app/write/Preview'
import { SOURCES } from '@/app/write/sources'
import { allPosts } from '@/app/content-index'
import { makeTemplate } from '@/app/write/templates'
import {
  frontmatterText,
  parseFrontmatter,
  patchFrontmatter,
} from '@/app/write/frontmatter'
import { useAutoSave, type SaveStatus } from '@/app/write/useAutoSave'
import {
  fetchGithub,
  loadSnapshot,
  uploadImage,
} from '@/app/write/persistence'
import type { PostType } from '@/app/content-index'
import type { RawMdxFrontmatter } from '*.mdx'

const Editor = lazy(() => import('@/app/write/Editor'))

const INITIAL_TYPE: PostType = 'essay'

export default function Write() {
  useDocumentMeta({ title: 'Write' })

  const [currentFile, setCurrentFile] = useState<{
    type: PostType
    slug: string
  } | null>(null)
  const [source, setSource] = useState<string>(() => makeTemplate(INITIAL_TYPE))
  const [type, setType] = useState<PostType>(INITIAL_TYPE)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [device, setDevice] = useState<'phone' | 'tablet' | 'desktop'>(
    'desktop',
  )
  const [panels, setPanels] = useState<{ left: boolean; right: boolean }>(
    () => {
      if (typeof window === 'undefined') return { left: true, right: true }
      const w = window.innerWidth
      return { left: w >= 1024, right: w >= 1280 }
    },
  )
  const [recent, setRecent] = useState<
    Array<{ type: PostType; slug: string }>
  >([])
  const [publishDialog, setPublishDialog] = useState(false)
  const [pendingSnapshot, setPendingSnapshot] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [activePane, setActivePane] = useState<'editor' | 'preview'>('editor')

  const parsed = useMemo(() => parseFrontmatter(source), [source])
  const deferredSource = useDeferredValue(source)
  const deferredParsed = useMemo(
    () => parseFrontmatter(deferredSource),
    [deferredSource],
  )

  const isModified = useMemo(() => {
    if (!currentFile) return false
    const key = `${currentFile.type}/${currentFile.slug}`
    return SOURCES[key] !== source
  }, [currentFile, source])

  const { Component, error, pending } = useMdxEval(deferredParsed.body)

  const linkStats = useMemo(
    () => validateLinks(parsed.body),
    [parsed.body],
  )

  const autoSave = useAutoSave(currentFile, source)

  const onSelect = useCallback((nextType: PostType, slug: string) => {
    const key = `${nextType}/${slug}`
    const raw = SOURCES[key]
    if (!raw) return
    setCurrentFile({ type: nextType, slug })
    setSource(raw)
    setType(nextType)
    setRecent((prev) => {
      const without = prev.filter(
        (r) => !(r.type === nextType && r.slug === slug),
      )
      return [{ type: nextType, slug }, ...without].slice(0, 5)
    })
  }, [])

  const onNew = useCallback((t: PostType) => {
    setCurrentFile(null)
    setType(t)
    setSource(makeTemplate(t))
  }, [])

  const onPatch = useCallback((patch: Partial<RawMdxFrontmatter>) => {
    setSource((s) => patchFrontmatter(s, patch))
  }, [])

  const onImageUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const result = await uploadImage(file)
      return result.ok ? result.url : null
    },
    [],
  )

  const onGithubCite = useCallback(
    async (url: string): Promise<string | null> => {
      const r = await fetchGithub(url)
      if (!r.ok) return null
      const canonical = `https://github.com/${r.owner}/${r.repo}/blob/${r.ref}/${r.path}#L${r.startLine}-L${r.endLine}`
      return '```' + r.lang + ' source=' + canonical + '\n' + r.content + '\n```\n'
    },
    [],
  )

  const doLoadSnapshot = useCallback(
    async (timestamp: string) => {
      if (!currentFile) return
      const r = await loadSnapshot(currentFile.type, currentFile.slug, timestamp)
      if (r.ok) setSource(r.source)
    },
    [currentFile],
  )

  const onLoadSnapshot = useCallback(
    (timestamp: string) => {
      if (!currentFile) return
      const dirty = SOURCES[`${currentFile.type}/${currentFile.slug}`] !== source
      if (dirty) {
        setPendingSnapshot(timestamp)
        return
      }
      void doLoadSnapshot(timestamp)
    },
    [currentFile, source, doLoadSnapshot],
  )

  const onConfirmLoadSnapshot = useCallback(() => {
    if (pendingSnapshot) void doLoadSnapshot(pendingSnapshot)
    setPendingSnapshot(null)
  }, [pendingSnapshot, doLoadSnapshot])

  // Cmd/Ctrl+. toggles focus mode; ESC always exits it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        setFocusMode((v) => !v)
        return
      }
      if (e.key === 'Escape') {
        setFocusMode((v) => (v ? false : v))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const draftRef = useRef(parsed.frontmatter.draft === true)
  draftRef.current = parsed.frontmatter.draft === true

  const onPublishToggle = useCallback(() => {
    if (draftRef.current) {
      setPublishDialog(true)
      return
    }
    const next = patchFrontmatter(source, { draft: true })
    setSource(next)
    void autoSave.flush(next)
  }, [source, autoSave])

  const onConfirmPublish = useCallback(() => {
    const next = patchFrontmatter(source, { draft: false })
    setSource(next)
    setPublishDialog(false)
    void autoSave.flush(next)
  }, [source, autoSave])

  const onTogglePanel = useCallback((side: 'left' | 'right') => {
    setPanels((p) => ({ ...p, [side]: !p[side] }))
  }, [])

  // Only mount the drawer Dialogs at widths where the side panel is *not*
  // already a column. Otherwise Radix's outside-click + ESC handling fires
  // on the hidden dialogs and collapses both panels at once.
  const leftAsDrawer = useMediaQuery('(max-width: 1023.98px)')
  const rightAsDrawer = useMediaQuery('(max-width: 1279.98px)')

  const fileKey = currentFile
    ? `${currentFile.type}/${currentFile.slug}`
    : 'draft'
  const rawFm = frontmatterText(source)
  const saveTick =
    autoSave.status.kind === 'saved' ? autoSave.status.at : 0

  const dimEditor = mode === 'edit' && activePane !== 'editor'
  const dimPreview = mode === 'edit' && activePane !== 'preview'

  return (
    <div className="flex flex-col h-screen min-h-0 bg-paper text-ink">
      {!focusMode ? (
        <Toolbar
          currentFile={currentFile}
          isModified={isModified}
          isDraft={parsed.frontmatter.draft === true}
          mode={mode}
          onModeChange={setMode}
          onPublishToggle={onPublishToggle}
          panels={panels}
          onTogglePanel={onTogglePanel}
        />
      ) : (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          aria-label="Exit focus mode"
          title="Exit focus mode (ESC)"
          className="fixed top-2 right-3 z-40 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint hover:text-ink transition-colors"
        >
          esc · focus
        </button>
      )}

      <div
        className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[var(--lg-cols)] xl:grid-cols-[var(--xl-cols)]"
        style={
          {
            '--lg-cols': focusMode
              ? '1fr'
              : panels.left
                ? '220px 1fr'
                : '1fr',
            '--xl-cols': focusMode ? '1fr' : xlCols(panels),
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            'border-r border-rule min-h-0 overflow-hidden',
            !focusMode && panels.left ? 'hidden lg:block' : 'hidden',
          )}
        >
          <Sidebar
            currentFile={currentFile}
            recent={recent}
            onSelect={onSelect}
            onNew={onNew}
          />
        </div>

        <div
          className={cn(
            'min-h-0 grid grid-cols-1',
            mode === 'edit' ? 'md:grid-cols-2' : 'md:grid-cols-1',
          )}
        >
          <div
            onPointerDown={() => setActivePane('editor')}
            className={cn(
              'min-h-0 border-r border-rule transition-opacity duration-300 hover:opacity-100',
              mode === 'edit' ? 'flex flex-col' : 'hidden',
              dimEditor ? 'opacity-40' : 'opacity-100',
            )}
          >
            <div className="flex-1 min-h-0">
              <Suspense fallback={<EditorFallback />}>
                <Editor
                  value={source}
                  onChange={setSource}
                  onImageUpload={onImageUpload}
                  onGithubCite={onGithubCite}
                />
              </Suspense>
            </div>
            <StatusLine
              body={parsed.body}
              brokenLinks={linkStats.broken}
              pending={pending}
              error={error}
              saveStatus={autoSave.status}
            />
          </div>

          <div
            onPointerDown={() => setActivePane('preview')}
            className={cn(
              'min-h-0 overflow-y-auto flex flex-col transition-opacity duration-300 hover:opacity-100',
              mode === 'preview' ? 'block' : 'hidden md:flex',
              dimPreview ? 'opacity-40' : 'opacity-100',
            )}
          >
            <div className="px-4 py-1.5 flex justify-center border-b border-rule bg-paper sticky top-0 z-10 shrink-0">
              <DeviceTabs value={device} onChange={setDevice} />
            </div>
            <div
              className="mx-auto py-8 px-6 w-full"
              style={{ maxWidth: DEVICE_MAX[device] }}
            >
              {error ? (
                <PreviewError message={error} />
              ) : Component ? (
                <Preview type={type} frontmatter={parsed.frontmatter}>
                  <Component />
                </Preview>
              ) : (
                <p className="text-ink-faint italic font-mono text-xs">
                  compiling…
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'border-l border-rule min-h-0 overflow-hidden',
            !focusMode && panels.right ? 'hidden xl:block' : 'hidden',
          )}
        >
          <MetaPanel
            fileKey={fileKey}
            frontmatter={parsed.frontmatter}
            type={type}
            onType={setType}
            onPatch={onPatch}
            parseError={parsed.error}
            rawFrontmatter={rawFm}
            currentFile={currentFile}
            saveTick={saveTick}
            onLoadSnapshot={onLoadSnapshot}
          />
        </div>
      </div>

      {leftAsDrawer ? (
        <SidePanelDrawer
          side="left"
          title="Files"
          open={panels.left}
          onOpenChange={(o) => setPanels((p) => ({ ...p, left: o }))}
        >
          <Sidebar
            currentFile={currentFile}
            recent={recent}
            onSelect={onSelect}
            onNew={onNew}
          />
        </SidePanelDrawer>
      ) : null}

      <ConfirmDialog
        open={pendingSnapshot !== null}
        onOpenChange={(o) => !o && setPendingSnapshot(null)}
        title="discard unsaved changes?"
        description={
          <p className="text-sm text-ink leading-snug">
            Loading this snapshot will replace the current editor content. Your
            in-flight changes will be lost.
          </p>
        }
        confirmLabel="load snapshot"
        onConfirm={onConfirmLoadSnapshot}
      />

      <ConfirmDialog
        open={publishDialog}
        onOpenChange={setPublishDialog}
        title="publish this post?"
        description={
          <div className="space-y-2">
            <p className="text-lg font-semibold text-ink leading-tight">
              {parsed.frontmatter.title ?? 'Untitled'}
            </p>
            {parsed.frontmatter.dek ? (
              <p className="text-sm text-ink-muted leading-snug">
                {parsed.frontmatter.dek}
              </p>
            ) : null}
            <p className="font-mono text-[11px] text-ink-faint uppercase tracking-[0.15em]">
              {parsed.frontmatter.date
                ? format(new Date(parsed.frontmatter.date), 'd MMM yyyy')
                : '—'}
            </p>
          </div>
        }
        note={
          <>
            Flips <code className="font-mono text-ink">draft: true</code> to{' '}
            <code className="font-mono text-ink">draft: false</code> and writes
            to disk immediately.
          </>
        }
        confirmLabel="publish"
        onConfirm={onConfirmPublish}
      />

      {rightAsDrawer ? (
        <SidePanelDrawer
          side="right"
          title="Document"
          open={panels.right}
          onOpenChange={(o) => setPanels((p) => ({ ...p, right: o }))}
        >
          <MetaPanel
            fileKey={fileKey}
            frontmatter={parsed.frontmatter}
            type={type}
            onType={setType}
            onPatch={onPatch}
            parseError={parsed.error}
            rawFrontmatter={rawFm}
            currentFile={currentFile}
            saveTick={saveTick}
            onLoadSnapshot={onLoadSnapshot}
          />
        </SidePanelDrawer>
      ) : null}
    </div>
  )
}

const DEVICE_MAX: Record<'phone' | 'tablet' | 'desktop', number> = {
  phone: 390,
  tablet: 768,
  desktop: 1024,
}

function DeviceTabs({
  value,
  onChange,
}: {
  value: 'phone' | 'tablet' | 'desktop'
  onChange: (v: 'phone' | 'tablet' | 'desktop') => void
}) {
  const opts: Array<'phone' | 'tablet' | 'desktop'> = [
    'phone',
    'tablet',
    'desktop',
  ]
  return (
    <div className="inline-flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
      {opts.map((opt, i) => (
        <span key={opt} className="inline-flex items-baseline gap-2">
          {i > 0 ? (
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            className={cn(
              'no-underline transition-opacity',
              value === opt
                ? 'nav-active text-ink'
                : 'text-ink-muted hover:opacity-75',
            )}
          >
            {opt}
          </button>
        </span>
      ))}
    </div>
  )
}

function xlCols(p: { left: boolean; right: boolean }): string {
  const parts: string[] = []
  if (p.left) parts.push('220px')
  parts.push('1fr')
  if (p.right) parts.push('300px')
  return parts.join(' ')
}

function StatusLine({
  body,
  brokenLinks,
  pending,
  error,
  saveStatus,
}: {
  body: string
  brokenLinks: number
  pending: boolean
  error: string | null
  saveStatus: SaveStatus
}) {
  const stats = useMemo(() => {
    const trimmed = body.trim()
    if (trimmed === '') return { chars: 0, words: 0, sentences: 0 }
    const words = trimmed.split(/\s+/).filter(Boolean).length
    const sentences = trimmed
      .split(/[.!?]+/)
      .filter((s) => s.trim() !== '').length
    return { chars: body.length, words, sentences }
  }, [body])
  const status = error ? 'error' : pending ? 'compiling…' : 'live'
  return (
    <div className="term-status px-4 py-1.5 border-t border-rule shrink-0 flex justify-between gap-3">
      <span className="value">
        {stats.words.toLocaleString()} words ·{' '}
        {stats.sentences.toLocaleString()} sent ·{' '}
        {stats.chars.toLocaleString()} chars
        {brokenLinks > 0 ? (
          <>
            {' · '}
            <span className="text-brand" title="broken internal links">
              {brokenLinks} broken
            </span>
          </>
        ) : null}{' · '}
        <span className={error ? 'text-brand' : ''}>{status}</span>
      </span>
      <SaveIndicator status={saveStatus} />
    </div>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status.kind === 'idle') return null
  if (status.kind === 'unsaved')
    return <span className="text-ink-faint">unsaved</span>
  if (status.kind === 'saving')
    return <span className="text-ink-muted">saving…</span>
  if (status.kind === 'saved')
    return (
      <span className="text-ink-muted" title={new Date(status.at).toISOString()}>
        saved {format(new Date(status.at), 'HH:mm:ss')}
      </span>
    )
  return (
    <span className="text-brand" title={status.message}>
      save failed
    </span>
  )
}

const KNOWN_STATIC_ROUTES = new Set([
  '/',
  '/archive',
  '/about',
  '/uses',
  '/now',
  '/projects',
  '/talks',
  '/reading',
  '/essays',
  '/notes',
  '/shipped',
  '/write',
  '/rss.xml',
])

const LINK_RE = /\[[^\]]*?\]\(([^)]+)\)/g
const POST_RE = /^\/(essays|notes|shipped)\/([^/?#]+)/

function validateLinks(body: string): { total: number; broken: number } {
  let total = 0
  let broken = 0
  for (const m of body.matchAll(LINK_RE)) {
    const raw = m[1]?.trim()
    if (!raw) continue
    total++
    const href = raw.split(/[?#]/)[0] ?? raw
    if (!href.startsWith('/')) continue
    if (KNOWN_STATIC_ROUTES.has(href)) continue
    const postMatch = href.match(POST_RE)
    if (postMatch) {
      const kind = postMatch[1] as 'essays' | 'notes' | 'shipped'
      const slug = postMatch[2]
      const type =
        kind === 'essays' ? 'essay' : kind === 'notes' ? 'note' : 'shipped'
      const exists = allPosts.some((p) => p.type === type && p.slug === slug)
      if (!exists) broken++
      continue
    }
    broken++
  }
  return { total, broken }
}

function EditorFallback() {
  return (
    <div className="h-full flex items-center justify-center text-ink-faint font-mono text-xs">
      loading editor…
    </div>
  )
}

function PreviewError({ message }: { message: string }) {
  return (
    <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--destructive)] border border-[var(--destructive)]/30 rounded p-3 bg-paper-raised/50">
      {message}
    </pre>
  )
}

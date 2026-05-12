import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'
import { useMdxEval } from '@/app/hooks/useMdxEval'
import { cn } from '@/app/lib/cn'
import { Toolbar } from '@/app/write/Toolbar'
import { Sidebar } from '@/app/write/Sidebar'
import { MetaPanel } from '@/app/write/MetaPanel'
import { Preview } from '@/app/write/Preview'
import { SOURCES } from '@/app/write/sources'
import { makeTemplate } from '@/app/write/templates'
import {
  parseFrontmatter,
  serializeFrontmatter,
} from '@/app/write/frontmatter'
import type { PostType } from '@/app/content-index'
import type { Frontmatter } from '*.mdx'

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

  const onPatch = useCallback((patch: Partial<Frontmatter>) => {
    setSource((s) => {
      const { frontmatter, body } = parseFrontmatter(s)
      return serializeFrontmatter({ ...frontmatter, ...patch }, body)
    })
  }, [])

  const onPublishToggle = useCallback(() => {
    setSource((s) => {
      const { frontmatter, body } = parseFrontmatter(s)
      return serializeFrontmatter(
        { ...frontmatter, draft: !frontmatter.draft },
        body,
      )
    })
  }, [])

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
  const rawFm = extractFrontmatterText(source)

  return (
    <div className="flex flex-col h-screen min-h-0 bg-paper text-ink">
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

      <div
        className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[var(--lg-cols)] xl:grid-cols-[var(--xl-cols)]"
        style={
          {
            '--lg-cols': panels.left ? '220px 1fr' : '1fr',
            '--xl-cols': xlCols(panels),
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            'border-r border-rule min-h-0 overflow-hidden',
            panels.left ? 'hidden lg:block' : 'hidden',
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
            className={cn(
              'min-h-0 border-r border-rule',
              mode === 'edit' ? 'flex flex-col' : 'hidden',
            )}
          >
            <div className="flex-1 min-h-0">
              <Suspense fallback={<EditorFallback />}>
                <Editor value={source} onChange={setSource} />
              </Suspense>
            </div>
            <StatusLine body={parsed.body} pending={pending} error={error} />
          </div>

          <div
            className={cn(
              'min-h-0 overflow-y-auto flex flex-col',
              mode === 'preview' ? 'block' : 'hidden md:flex',
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
            panels.right ? 'hidden xl:block' : 'hidden',
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
          />
        </div>
      </div>

      {leftAsDrawer ? (
        <Dialog.Root
          open={panels.left}
          onOpenChange={(o) => setPanels((p) => ({ ...p, left: o }))}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-[2px]" />
            <Dialog.Content
              onPointerDownOutside={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
              className="fixed inset-y-0 left-0 z-50 w-[260px] bg-paper border-r border-rule shadow-lg"
            >
              <Dialog.Title className="sr-only">Files</Dialog.Title>
              <Sidebar
                currentFile={currentFile}
                recent={recent}
                onSelect={onSelect}
                onNew={onNew}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}

      {rightAsDrawer ? (
        <Dialog.Root
          open={panels.right}
          onOpenChange={(o) => setPanels((p) => ({ ...p, right: o }))}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-[2px]" />
            <Dialog.Content
              onPointerDownOutside={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
              className="fixed inset-y-0 right-0 z-50 w-[320px] bg-paper border-l border-rule shadow-lg"
            >
              <Dialog.Title className="sr-only">Document</Dialog.Title>
              <MetaPanel
                fileKey={fileKey}
                frontmatter={parsed.frontmatter}
                type={type}
                onType={setType}
                onPatch={onPatch}
                parseError={parsed.error}
                rawFrontmatter={rawFm}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </div>
  )
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })
  useEffect(() => {
    const mq = window.matchMedia(query)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', listener)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', listener)
  }, [query])
  return matches
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

function extractFrontmatterText(source: string): string {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return m?.[1] ?? ''
}

function StatusLine({
  body,
  pending,
  error,
}: {
  body: string
  pending: boolean
  error: string | null
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
    <div className="term-status px-4 py-1.5 border-t border-rule shrink-0">
      <span className="value">
        {stats.words.toLocaleString()} words ·{' '}
        {stats.sentences.toLocaleString()} sent ·{' '}
        {stats.chars.toLocaleString()} chars ·{' '}
        <span className={error ? 'text-brand' : ''}>{status}</span>
      </span>
    </div>
  )
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

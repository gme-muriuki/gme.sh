import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
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
  const [panels, setPanels] = useState({ left: false, right: false })

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
    setPanels((p) => ({ ...p, left: false }))
  }, [])

  const onNew = useCallback((t: PostType) => {
    setCurrentFile(null)
    setType(t)
    setSource(makeTemplate(t))
    setPanels((p) => ({ ...p, left: false }))
  }, [])

  const onPatch = useCallback((patch: Partial<Frontmatter>) => {
    setSource((s) => {
      const { frontmatter, body } = parseFrontmatter(s)
      return serializeFrontmatter({ ...frontmatter, ...patch }, body)
    })
  }, [])

  const onTogglePanel = useCallback((side: 'left' | 'right') => {
    setPanels((p) => ({ ...p, [side]: !p[side] }))
  }, [])

  const fileKey = currentFile
    ? `${currentFile.type}/${currentFile.slug}`
    : 'draft'
  const rawFm = extractFrontmatterText(source)

  return (
    <div className="flex flex-col h-screen min-h-0 bg-paper text-ink">
      <Toolbar
        currentFile={currentFile}
        isModified={isModified}
        mode={mode}
        onModeChange={setMode}
        panels={panels}
        onTogglePanel={onTogglePanel}
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_300px]">
        <div className="hidden lg:block border-r border-rule min-h-0 overflow-hidden">
          <Sidebar
            currentFile={currentFile}
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
            <StatusLine source={source} pending={pending} error={error} />
          </div>

          <div
            className={cn(
              'min-h-0 overflow-y-auto',
              mode === 'preview' ? 'block' : 'hidden md:block',
            )}
          >
            <div className="chrome-frame py-8">
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

        <div className="hidden xl:block border-l border-rule min-h-0 overflow-hidden">
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

      <Dialog.Root
        open={panels.left}
        onOpenChange={(o) => setPanels((p) => ({ ...p, left: o }))}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-[2px] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[260px] bg-paper border-r border-rule shadow-lg lg:hidden">
            <Dialog.Title className="sr-only">Files</Dialog.Title>
            <Sidebar
              currentFile={currentFile}
              onSelect={onSelect}
              onNew={onNew}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={panels.right}
        onOpenChange={(o) => setPanels((p) => ({ ...p, right: o }))}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-[2px] xl:hidden" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[320px] bg-paper border-l border-rule shadow-lg xl:hidden">
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
    </div>
  )
}

function extractFrontmatterText(source: string): string {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return m?.[1] ?? ''
}

function StatusLine({
  source,
  pending,
  error,
}: {
  source: string
  pending: boolean
  error: string | null
}) {
  const chars = source.length
  const words = useMemo(
    () => source.trim().split(/\s+/).filter(Boolean).length,
    [source],
  )
  const status = error ? 'error' : pending ? 'compiling…' : 'live'
  return (
    <div className="term-status px-4 py-1.5 border-t border-rule shrink-0">
      <span className="value">
        {chars.toLocaleString()} chars · {words.toLocaleString()} words ·{' '}
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

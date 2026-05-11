import { useEffect, useMemo, useState } from 'react'
import { useMdxEval } from '@/app/hooks/useMdxEval'
import { EssayLayout } from '@/app/post/EssayLayout'
import { NoteLayout } from '@/app/post/NoteLayout'
import { ShippedLayout } from '@/app/post/ShippedLayout'

type PostType = 'essay' | 'note' | 'shipped'
type Growth = 'seedling' | 'growing' | 'evergreen'

const DEFAULT_BODY = `Open with one tight paragraph. The reader is on the fence about whether to keep going — earn the next click here, not in the heading.

## A section heading

Body copy, with an inline aside.<Sidenote>Sidenotes flow into the right rail on desktop and collapse to a popover on mobile.</Sidenote>

\`\`\`rust src/lib.rs
fn allocate(layout: Layout) -> *mut u8 {
    System.alloc(layout)
}
\`\`\`

<Callout type="note">
Callouts use a quiet brand-edged frame.
</Callout>
`

export default function Write() {
  const [postType, setPostType] = useState<PostType>('essay')
  const [title, setTitle] = useState('Untitled')
  const [dek, setDek] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [growth, setGrowth] = useState<Growth>('seedling')
  const [body, setBody] = useState(DEFAULT_BODY)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // debounce body so we don't recompile on every keystroke
  const [debouncedBody, setDebouncedBody] = useState(body)
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedBody(body), 280)
    return () => window.clearTimeout(id)
  }, [body])

  const { Component, error, pending } = useMdxEval(debouncedBody)

  const tags = useMemo(
    () =>
      tagsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [tagsRaw],
  )
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  return (
    <div className="min-h-[80vh]">
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          write &mdash; in-memory only, no persistence
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tighter leading-[1] text-ink">
          /write
        </h1>
      </header>

      <Toolbar
        postType={postType}
        setPostType={setPostType}
        title={title}
        setTitle={setTitle}
        dek={dek}
        setDek={setDek}
        tagsRaw={tagsRaw}
        setTagsRaw={setTagsRaw}
        growth={growth}
        setGrowth={setGrowth}
        advancedOpen={advancedOpen}
        setAdvancedOpen={setAdvancedOpen}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted mb-2">
            body &middot; MDX
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-[60vh] font-mono text-[13px] leading-[1.65] bg-paper-raised/50 border border-rule rounded p-4 text-ink resize-vertical focus:outline-none focus:border-rule-strong"
          />
          <p className="mt-2 font-mono text-[10px] text-ink-faint">
            {body.length.toLocaleString()} chars &middot;{' '}
            {pending ? 'compiling…' : error ? 'error' : 'live'}
          </p>
        </div>

        <div className="lg:border-l lg:border-rule lg:pl-6 min-w-0">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            preview
          </label>
          {error ? (
            <pre className="mt-3 text-xs font-mono whitespace-pre-wrap text-[var(--destructive)] border border-[var(--destructive)]/30 rounded p-3 bg-paper-raised/50">
              {error}
            </pre>
          ) : Component ? (
            <div className="mt-4">
              <Preview
                postType={postType}
                title={title}
                dek={dek || undefined}
                date={today}
                tags={tags.length > 0 ? tags : undefined}
                growth={growth}
              >
                <Component />
              </Preview>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-faint italic">
              compiling…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Toolbar(props: {
  postType: PostType
  setPostType: (v: PostType) => void
  title: string
  setTitle: (v: string) => void
  dek: string
  setDek: (v: string) => void
  tagsRaw: string
  setTagsRaw: (v: string) => void
  growth: Growth
  setGrowth: (v: Growth) => void
  advancedOpen: boolean
  setAdvancedOpen: (v: boolean) => void
}) {
  const {
    postType,
    setPostType,
    title,
    setTitle,
    dek,
    setDek,
    tagsRaw,
    setTagsRaw,
    growth,
    setGrowth,
    advancedOpen,
    setAdvancedOpen,
  } = props

  return (
    <div className="border border-rule rounded bg-paper-raised/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <TypePicker value={postType} onChange={setPostType} />
        <Field label="title" className="flex-1 min-w-[18ch]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-rule focus:border-ink focus:outline-none py-1 text-base text-ink"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Field label="dek" className="flex-1 min-w-[24ch]">
          <input
            type="text"
            value={dek}
            onChange={(e) => setDek(e.target.value)}
            placeholder="optional sentence under the title"
            className="w-full bg-transparent border-b border-rule focus:border-ink focus:outline-none py-1 text-sm text-ink-muted placeholder:text-ink-faint"
          />
        </Field>
        <Field label="tags" className="flex-1 min-w-[18ch]">
          <input
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="rust, systems, allocators"
            className="w-full bg-transparent border-b border-rule focus:border-ink focus:outline-none py-1 text-sm text-ink-muted placeholder:text-ink-faint"
          />
        </Field>
        {postType === 'note' ? (
          <Field label="growth">
            <select
              value={growth}
              onChange={(e) => setGrowth(e.target.value as Growth)}
              className="bg-transparent border-b border-rule focus:border-ink focus:outline-none py-1 text-sm text-ink"
            >
              <option value="seedling">seedling</option>
              <option value="growing">growing</option>
              <option value="evergreen">evergreen</option>
            </select>
          </Field>
        ) : null}
      </div>
      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors"
        >
          {advancedOpen ? '▾' : '▸'} frontmatter
        </button>
        {advancedOpen ? (
          <pre className="mt-2 not-prose rounded border border-rule bg-paper p-3 text-[11.5px] font-mono leading-[1.5] text-ink-muted overflow-x-auto">
{`---
title: ${title}
date: ${new Date().toISOString().slice(0, 10)}
type: ${postType}${dek ? `\ndek: ${dek}` : ''}${tagsRaw ? `\ntags: [${tagsRaw.split(',').map((s) => s.trim()).filter(Boolean).map((t) => `"${t}"`).join(', ')}]` : ''}${postType === 'note' ? `\ngrowth: ${growth}` : ''}
---`}
          </pre>
        ) : null}
      </div>
    </div>
  )
}

function TypePicker({
  value,
  onChange,
}: {
  value: PostType
  onChange: (v: PostType) => void
}) {
  const opts: PostType[] = ['essay', 'note', 'shipped']
  return (
    <div className="inline-flex rounded border border-rule overflow-hidden">
      {opts.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            'px-3 py-1 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors border-r border-rule last:border-r-0',
            opt === value
              ? 'bg-paper text-ink'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label
      className={['flex flex-col gap-0.5', className ?? ''].join(' ').trim()}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

function Preview(props: {
  postType: PostType
  title: string
  dek?: string
  date: string
  tags?: string[]
  growth: Growth
  children: React.ReactNode
}) {
  const { postType, title, dek, date, tags, growth, children } = props
  if (postType === 'essay') {
    return (
      <EssayLayout
        title={title}
        dek={dek}
        date={date}
        tags={tags}
        permalink="/write/preview"
      >
        {children}
      </EssayLayout>
    )
  }
  if (postType === 'note') {
    return (
      <NoteLayout
        title={title}
        date={date}
        growth={growth}
        tags={tags}
        permalink="/write/preview"
      >
        {children}
      </NoteLayout>
    )
  }
  return (
    <ShippedLayout
      title={title}
      dek={dek}
      date={date}
      tags={tags}
      permalink="/write/preview"
    >
      {children}
    </ShippedLayout>
  )
}

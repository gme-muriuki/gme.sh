import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import type { RawMdxFrontmatter } from '*.mdx'
import type { PostType } from '@/app/content-index'
import { SquareMark } from '@/app/chrome/SquareMark'
import { cn } from '@/app/lib/cn'
import { listSnapshots, persistenceAvailable } from './persistence'

type FmPatch = Partial<RawMdxFrontmatter>

type Props = {
  fileKey: string
  frontmatter: Partial<RawMdxFrontmatter>
  type: PostType
  onType: (t: PostType) => void
  onPatch: (patch: FmPatch) => void
  parseError: string | null
  rawFrontmatter: string
  currentFile: { type: PostType; slug: string } | null
  saveTick: number
  onLoadSnapshot: (timestamp: string) => void
}

export function MetaPanel({
  fileKey,
  frontmatter: f,
  type,
  onType,
  onPatch,
  parseError,
  rawFrontmatter,
  currentFile,
  saveTick,
  onLoadSnapshot,
}: Props) {
  return (
    <aside
      key={fileKey}
      aria-label="Document properties"
      className="h-full overflow-y-auto px-5 py-5 text-[13px]"
    >
      <SectionLabel>document</SectionLabel>

      {parseError ? (
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-brand">
          frontmatter parse error
          <span className="block mt-1 normal-case tracking-normal text-ink-muted text-xs">
            {parseError}
          </span>
        </p>
      ) : null}

      <Section title="identity">
        <Field label="title">
          <TextInput
            defaultValue={f.title ?? ''}
            onCommit={(v) => onPatch({ title: v })}
          />
        </Field>
        <Field label="dek">
          <TextInput
            defaultValue={f.dek ?? ''}
            placeholder="optional sentence"
            onCommit={(v) => onPatch({ dek: v || undefined })}
          />
        </Field>
        <Field label="tags">
          <TextInput
            defaultValue={(f.tags ?? []).join(', ')}
            placeholder="rust, allocators"
            onCommit={(v) => onPatch({ tags: parseTagList(v) })}
          />
        </Field>
      </Section>

      <Section title="schedule">
        <Field label="date">
          <input
            type="date"
            defaultValue={f.date ?? ''}
            onBlur={(e) => onPatch({ date: e.currentTarget.value })}
            className={inputClass}
          />
        </Field>
        <Field label="status">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'size-1.5 rounded-full shrink-0',
                f.draft ? 'bg-brand' : 'bg-ink-faint',
              )}
            />
            <select
              value={f.draft ? 'draft' : 'published'}
              onChange={(e) =>
                onPatch({ draft: e.currentTarget.value === 'draft' })
              }
              className={cn(inputClass, 'flex-1')}
            >
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>
          </div>
        </Field>
        <Field label="reading time (min)">
          <input
            type="number"
            min={1}
            defaultValue={f.readingTime ?? ''}
            onBlur={(e) => {
              const n = Number.parseInt(e.currentTarget.value, 10)
              onPatch({ readingTime: Number.isFinite(n) ? n : undefined })
            }}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="type">
        <Segmented<PostType>
          value={type}
          options={[
            { value: 'essay', label: 'essay' },
            { value: 'note', label: 'note' },
            { value: 'shipped', label: 'shipped' },
            { value: 'page', label: 'page' },
          ]}
          onChange={onType}
        />
      </Section>

      {type === 'note' ? (
        <Section title="note">
          <Field label="growth">
            <select
              value={f.growth ?? 'seedling'}
              onChange={(e) =>
                onPatch({
                  growth: e.currentTarget.value as RawMdxFrontmatter['growth'],
                })
              }
              className={inputClass}
            >
              <option value="seedling">seedling</option>
              <option value="growing">growing</option>
              <option value="evergreen">evergreen</option>
            </select>
          </Field>
          <Field label="last tended">
            <input
              type="date"
              defaultValue={f.lastTended ?? ''}
              onBlur={(e) =>
                onPatch({ lastTended: e.currentTarget.value || undefined })
              }
              className={inputClass}
            />
          </Field>
        </Section>
      ) : null}

      {type === 'shipped' ? (
        <Section title="shipped">
          <Field label="hero">
            <TextInput
              defaultValue={f.hero ?? ''}
              placeholder="https://"
              onCommit={(v) => onPatch({ hero: v || undefined })}
            />
          </Field>
          <Field label="links">
            <LinksRepeater
              value={f.links ?? []}
              onCommit={(v) =>
                onPatch({ links: v.length > 0 ? v : undefined })
              }
            />
          </Field>
        </Section>
      ) : null}

      <SeriesSection
        series={f.series}
        onCommit={(v) => onPatch({ series: v })}
      />

      <Section title="seo">
        <Field label="og image">
          <TextInput
            defaultValue={f.ogImage ?? ''}
            placeholder="/og/post.jpg"
            onCommit={(v) => onPatch({ ogImage: v || undefined })}
          />
        </Field>
        <Field label="og description">
          <TextInput
            defaultValue={f.ogDescription ?? ''}
            placeholder="custom social card description"
            onCommit={(v) => onPatch({ ogDescription: v || undefined })}
          />
        </Field>
      </Section>

      <HistorySection
        currentFile={currentFile}
        saveTick={saveTick}
        onLoad={onLoadSnapshot}
      />

      <Section title="frontmatter">
        <pre className="not-prose rounded border border-rule bg-paper p-3 text-[11px] font-mono leading-[1.55] text-ink-muted overflow-x-auto whitespace-pre-wrap">
          {rawFrontmatter.trim() || '(empty)'}
        </pre>
      </Section>
    </aside>
  )
}

function parseStamp(stamp: string): Date | null {
  const m = stamp.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})(.*)$/)
  if (!m) return null
  const iso = `${m[1]}T${m[2]}:${m[3]}:${m[4]}${m[5] ?? ''}`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function HistorySection({
  currentFile,
  saveTick,
  onLoad,
}: {
  currentFile: { type: PostType; slug: string } | null
  saveTick: number
  onLoad: (timestamp: string) => void
}) {
  const [snapshots, setSnapshots] = useState<string[]>([])

  useEffect(() => {
    if (!currentFile || !persistenceAvailable) {
      setSnapshots([])
      return
    }
    let cancelled = false
    listSnapshots(currentFile.type, currentFile.slug).then((r) => {
      if (cancelled) return
      setSnapshots(r.ok ? r.snapshots : [])
    })
    return () => {
      cancelled = true
    }
  }, [currentFile, saveTick])

  return (
    <Section title="history">
      {!currentFile ? (
        <p className="text-[11px] text-ink-faint italic">
          Save the file first to start collecting snapshots.
        </p>
      ) : snapshots.length === 0 ? (
        <p className="text-[11px] text-ink-faint italic">No snapshots yet.</p>
      ) : (
        <ul className="space-y-0.5 max-h-48 overflow-y-auto -mx-1">
          {snapshots.map((stamp) => {
            const d = parseStamp(stamp)
            return (
              <li key={stamp}>
                <button
                  type="button"
                  onClick={() => onLoad(stamp)}
                  className="w-full text-left font-mono text-[11px] text-ink-muted hover:text-ink hover:bg-paper-raised px-1 py-0.5 rounded transition-colors"
                  title={stamp}
                >
                  {d ? format(d, 'd MMM HH:mm:ss') : stamp}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

const inputClass =
  'w-full bg-transparent border-b border-rule focus:border-ink focus:outline-none py-1 text-[13px] text-ink placeholder:text-ink-faint'

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
      {children}
    </p>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-6">
      <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        <SquareMark className="text-[6px]" />
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="block mb-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  )
}

function TextInput({
  defaultValue,
  placeholder,
  onCommit,
}: {
  defaultValue: string
  placeholder?: string
  onCommit: (v: string) => void
}) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      onBlur={(e) => onCommit(e.currentTarget.value.trim())}
      className={inputClass}
    />
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap rounded border border-rule overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={opt.value === value}
          className={cn(
            'px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors border-r border-rule last:border-r-0',
            opt.value === value
              ? 'bg-paper-raised text-ink'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function parseTagList(s: string): string[] | undefined {
  const arr = s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return arr.length > 0 ? arr : undefined
}

function LinksRepeater({
  value,
  onCommit,
}: {
  value: { label: string; href: string }[]
  onCommit: (v: { label: string; href: string }[]) => void
}) {
  // Uncontrolled per row; commit the whole array on any blur or row change.
  // The parent re-keys on file change, so defaults reset cleanly.
  const rows = useMemo(
    () => (value.length > 0 ? value : [{ label: '', href: '' }]),
    [value],
  )

  const commit = (next: { label: string; href: string }[]) => {
    onCommit(
      next.filter((r) => r.label.trim() !== '' || r.href.trim() !== ''),
    )
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-baseline gap-2">
          <input
            type="text"
            defaultValue={row.label}
            placeholder="label"
            onBlur={(e) => {
              const next = [...rows]
              next[i] = { ...row, label: e.currentTarget.value.trim() }
              commit(next)
            }}
            className={cn(inputClass, 'flex-1 min-w-0')}
          />
          <input
            type="url"
            defaultValue={row.href}
            placeholder="href"
            onBlur={(e) => {
              const next = [...rows]
              next[i] = { ...row, href: e.currentTarget.value.trim() }
              commit(next)
            }}
            className={cn(inputClass, 'flex-[2] min-w-0')}
          />
          <button
            type="button"
            onClick={() => commit(rows.filter((_, j) => j !== i))}
            aria-label="remove link"
            className="text-ink-faint hover:text-brand text-sm leading-none px-1"
          >
            −
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => commit([...rows, { label: '', href: '' }])}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors"
      >
        + add link
      </button>
    </div>
  )
}

function SeriesSection({
  series,
  onCommit,
}: {
  series: RawMdxFrontmatter['series'] | undefined
  onCommit: (v: RawMdxFrontmatter['series'] | undefined) => void
}) {
  const has = series != null
  return (
    <Section title="series (advanced)">
      {has ? (
        <>
          <Field label="name">
            <TextInput
              defaultValue={series?.name ?? ''}
              onCommit={(v) =>
                onCommit({
                  name: v,
                  index: series?.index ?? 1,
                  total: series?.total ?? 1,
                })
              }
            />
          </Field>
          <div className="flex gap-3">
            <Field label="index">
              <input
                type="number"
                min={1}
                defaultValue={series?.index ?? 1}
                onBlur={(e) =>
                  onCommit({
                    name: series?.name ?? '',
                    index: Number.parseInt(e.currentTarget.value, 10) || 1,
                    total: series?.total ?? 1,
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="total">
              <input
                type="number"
                min={1}
                defaultValue={series?.total ?? 1}
                onBlur={(e) =>
                  onCommit({
                    name: series?.name ?? '',
                    index: series?.index ?? 1,
                    total: Number.parseInt(e.currentTarget.value, 10) || 1,
                  })
                }
                className={inputClass}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => onCommit(undefined)}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-brand transition-colors"
          >
            remove series
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => onCommit({ name: '', index: 1, total: 1 })}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors"
        >
          + add series
        </button>
      )}
    </Section>
  )
}

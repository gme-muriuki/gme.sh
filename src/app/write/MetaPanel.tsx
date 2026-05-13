import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import type { Relation, RelationKind, RawMdxFrontmatter } from '*.mdx'
import { allPosts, type PostType } from '@/app/content-index'
import { SquareMark } from '@/app/chrome/SquareMark'
import { cn } from '@/app/lib/cn'
import { KIND_LABEL } from '@/app/post/Relations'
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

/**
 * Render the document metadata editor sidebar for a file.
 *
 * Provides editable frontmatter fields, type-specific sections, relations/series editors,
 * a snapshot history viewer, and a read-only raw frontmatter preview.
 *
 * @param fileKey - Unique key for the current file view (used as the root element key)
 * @param frontmatter - Current parsed frontmatter values for the document
 * @param type - Current post type (`essay`, `note`, `shipped`, or `page`)
 * @param onType - Callback invoked when the post type changes
 * @param onPatch - Callback invoked with partial frontmatter updates
 * @param parseError - Optional frontmatter parse error message to display
 * @param rawFrontmatter - Raw frontmatter text shown in the preview
 * @param currentFile - Identifier for the file used by the history section (may be null)
 * @param saveTick - Tick value used to refresh the history list when saves occur
 * @param onLoadSnapshot - Callback invoked with a snapshot stamp when a snapshot is loaded
 * @returns The React element for the metadata editing sidebar
 */
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

      <Section title="relations">
        <RelationsEditor
          value={f.relations ?? []}
          onCommit={(v) => onPatch({ relations: v.length > 0 ? v : undefined })}
        />
      </Section>

      <datalist id="all-post-targets">
        {allPosts.map((p) => (
          <option
            key={`${p.type}/${p.slug}`}
            value={`${p.type}/${p.slug}`}
            label={p.frontmatter.title}
          />
        ))}
      </datalist>

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

/**
 * Parse a snapshot timestamp string into a Date.
 *
 * Accepts timestamps in the form `YYYY-MM-DDTHH-MM-SS` with an optional suffix after the seconds; returns a Date representing that timestamp when valid.
 *
 * @param stamp - The snapshot timestamp string to parse.
 * @returns A `Date` for the parsed timestamp, or `null` if the input does not match the expected format or produces an invalid date.
 */
function parseStamp(stamp: string): Date | null {
  const m = stamp.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})(.*)$/)
  if (!m) return null
  const iso = `${m[1]}T${m[2]}:${m[3]}:${m[4]}${m[5] ?? ''}`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Render a "history" section listing stored snapshots for the given file and allow loading a selected snapshot.
 *
 * When `currentFile` is null the component shows a prompt to save; when there are no snapshots it shows an empty-state message.
 * When snapshots are available it renders a scrollable list of timestamped buttons; activating a button calls `onLoad` with that snapshot's timestamp.
 *
 * @param currentFile - The active file identifier, or `null` when the file is unsaved. Shape: `{ type: PostType; slug: string } | null`.
 * @param saveTick - Incremented value used to trigger reloading the snapshot list when the file is saved or snapshots change.
 * @param onLoad - Callback invoked with the selected snapshot timestamp when the user loads a snapshot.
 * @returns The history UI section containing messages or a list of snapshot buttons.
 */
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

// Borders sleep until the value is being interacted with. An ink-coloured
// value reads as a settled fact; the form affordance only shows up when
// you reach for it.
const inputClass =
  'w-full bg-transparent border-b border-transparent hover:border-rule focus:border-ink focus:outline-none py-0.5 text-[13px] text-ink placeholder:text-ink-faint transition-colors'

/**
 * Render a small monospace uppercase label used above a section.
 *
 * @param children - Content to display inside the label
 * @returns A paragraph element styled as a muted, uppercase section label
 */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
      {children}
    </p>
  )
}

/**
 * Render a titled vertical section with a compact mono label and spaced content.
 *
 * @param title - The section heading displayed in a small uppercase mono label
 * @param children - Section content rendered beneath the heading
 * @returns A <section> element containing the label row and the provided children
 */
function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-8">
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        <SquareMark className="text-[6px]" />
        {title}
      </p>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/**
 * Render a labeled form field wrapper that displays a small uppercase label above arbitrary content.
 *
 * @param label - The label text shown above the field
 * @param children - The field content (inputs, controls, or other elements) rendered beneath the label
 * @returns A labeled field element suitable for use in forms and settings panels
 */
function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="block mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  )
}

/**
 * Uncontrolled text input that trims its value and calls a commit handler when blurred.
 *
 * @param defaultValue - Initial input value
 * @param placeholder - Optional placeholder text shown when empty
 * @param onCommit - Called with the trimmed input value when the field loses focus
 */
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

/**
 * Render a compact, mono-styled segmented control of labeled options and allow switching the selected option.
 *
 * @param value - The currently selected option value.
 * @param options - Array of option objects with `value` and `label` shown as segment buttons.
 * @param onChange - Called with an option's `value` when that segment is activated.
 * @returns The rendered segmented control element.
 */
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
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em]">
      {options.map((opt, i) => (
        <span key={opt.value} className="inline-flex items-baseline gap-3">
          {i > 0 ? (
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={opt.value === value}
            className={cn(
              'transition-colors',
              opt.value === value
                ? 'nav-active text-ink'
                : 'text-ink-faint hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  )
}

/**
 * Parse a comma-separated tag string into an array of trimmed tags.
 *
 * @param s - Comma-separated list of tags; individual items are trimmed
 * @returns `string[]` of non-empty trimmed tags if any are present, `undefined` otherwise
 */
function parseTagList(s: string): string[] | undefined {
  const arr = s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return arr.length > 0 ? arr : undefined
}

/**
 * Render an editable list of links (label + href) that commits a cleaned array on changes.
 *
 * @param value - The current list of link objects; an empty array displays a single blank row for entry.
 * @param onCommit - Called with the new list after edits; entries with both label and href empty are omitted.
 */
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
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint hover:text-brand px-1 transition-colors"
          >
            remove
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

/**
 * Renders an editor for a list of relations and commits changes.
 *
 * Allows editing each relation's kind, target, and optional note, and supports adding or removing rows.
 *
 * @param value - The current list of relations displayed in the editor.
 * @param onCommit - Called with the updated list when the user changes rows. Relations with an empty `target` are removed before committing.
 * @returns The React element for the relations editor.
 */
function RelationsEditor({
  value,
  onCommit,
}: {
  value: Relation[]
  onCommit: (v: Relation[]) => void
}) {
  const blank: Relation = { kind: 'influencedBy', target: '' }
  const rows = useMemo(() => (value.length > 0 ? value : [blank]), [value])

  const commit = (next: Relation[]) => {
    onCommit(next.filter((r) => r.target.trim() !== ''))
  }

  const kinds = Object.entries(KIND_LABEL) as [RelationKind, string][]

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <select
              value={row.kind}
              onChange={(e) => {
                const next = [...rows]
                next[i] = {
                  ...row,
                  kind: e.currentTarget.value as RelationKind,
                }
                commit(next)
              }}
              className={cn(inputClass, 'w-1/2 shrink-0')}
            >
              {kinds.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              list="all-post-targets"
              defaultValue={row.target}
              placeholder="essay/foo"
              onBlur={(e) => {
                const next = [...rows]
                next[i] = { ...row, target: e.currentTarget.value.trim() }
                commit(next)
              }}
              className={cn(inputClass, 'flex-1 min-w-0')}
            />
            <button
              type="button"
              onClick={() => commit(rows.filter((_, j) => j !== i))}
              aria-label="remove relation"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint hover:text-brand px-1 transition-colors"
            >
              remove
            </button>
          </div>
          <input
            type="text"
            defaultValue={row.note ?? ''}
            placeholder="optional note"
            onBlur={(e) => {
              const next = [...rows]
              const note = e.currentTarget.value.trim()
              next[i] = { ...row, note: note || undefined }
              commit(next)
            }}
            className={inputClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          commit([...rows, { kind: 'influencedBy', target: '' }])
        }
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors"
      >
        + add relation
      </button>
    </div>
  )
}

/**
 * Render the "series" advanced frontmatter editor.
 *
 * @param series - The current `series` frontmatter object to edit, or `undefined` when none is set.
 * @param onCommit - Callback invoked with the updated `series` object, or `undefined` to remove it.
 * @returns The UI section for viewing and editing the `series` frontmatter (name, index, total).
 */
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

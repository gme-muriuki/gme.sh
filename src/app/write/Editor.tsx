import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EditorSelection,
  EditorState,
  RangeSetBuilder,
} from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import {
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { cn } from '@/app/lib/cn'

/**
 * Create a CodeMirror command that wraps the current selection with the given prefix and suffix.
 *
 * @param prefix - Text to insert before the selection
 * @param suffix - Text to insert after the selection; defaults to `prefix`
 * @returns A command function that applies the wrap, places the cursor inside the wrapped content, focuses the editor, and returns `true`
 */
function wrap(prefix: string, suffix: string = prefix) {
  return (view: EditorView): boolean => {
    view.dispatch(
      view.state.changeByRange((range) => {
        const text = view.state.sliceDoc(range.from, range.to)
        const insert = prefix + text + suffix
        const inner = range.from + prefix.length
        return {
          changes: { from: range.from, to: range.to, insert },
          range: EditorSelection.range(inner, inner + text.length),
        }
      }),
    )
    view.focus()
    return true
  }
}

/**
 * Wraps the current selection (or the literal "text" when the selection is empty) in Markdown link syntax and selects the placeholder URL portion.
 *
 * @param view - The CodeMirror EditorView to modify
 * @returns `true`
 */
function wrapLink(view: EditorView): boolean {
  view.dispatch(
    view.state.changeByRange((range) => {
      const sel = view.state.sliceDoc(range.from, range.to)
      const text = sel || 'text'
      const insert = `[${text}](url)`
      const urlStart = range.from + 1 + text.length + 2
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.range(urlStart, urlStart + 3),
      }
    }),
  )
  view.focus()
  return true
}

const mdShortcuts = keymap.of([
  { key: 'Mod-b', run: wrap('**') },
  { key: 'Mod-i', run: wrap('*') },
  { key: 'Mod-e', run: wrap('`') },
  { key: 'Mod-l', run: wrapLink },
])

// Custom focus-line decoration: a `cm-focusLine` class on the active
// line and `cm-focusLineGutter` on its gutter, so CSS owns the visual.
// Replaces CodeMirror's stock `highlightActiveLine`, which paints a
// full-width tint that reads as IDE rather than writing surface.
const lineMark = Decoration.line({ attributes: { class: 'cm-focusLine' } })
const gutterMark = Decoration.line({
  attributes: { class: 'cm-focusLineGutter' },
})

const focusLine = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = this.build(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.selectionSet || u.viewportChanged) {
        this.decorations = this.build(u.view)
      }
    }
    build(view: EditorView): DecorationSet {
      const b = new RangeSetBuilder<Decoration>()
      const seen = new Set<number>()
      for (const r of view.state.selection.ranges) {
        if (!r.empty) continue
        const line = view.state.doc.lineAt(r.head)
        if (seen.has(line.from)) continue
        seen.add(line.from)
        b.add(line.from, line.from, lineMark)
        b.add(line.from, line.from, gutterMark)
      }
      return b.finish()
    }
  },
  { decorations: (v) => v.decorations },
)

// Frontmatter + JSX-component awareness. We don't pull in a full MDX
// parser — overkill for visual cues. A single pass over the doc tags
// the leading `---`...`---` block as `cm-frontmatter` and any line
// that looks like an MDX component (`<Capitalised ...>` / `</Cap>`)
// as `cm-mdx-component`. CSS handles the visual.
const fmLine = Decoration.line({ attributes: { class: 'cm-frontmatter' } })
const fmFence = Decoration.line({
  attributes: { class: 'cm-frontmatter-fence' },
})
const jsxLine = Decoration.line({ attributes: { class: 'cm-mdx-component' } })

const FENCE_RE = /^```/
const JSX_OPEN_RE = /^\s*<[A-Z][\w.]*[\s/>]/
const JSX_CLOSE_RE = /^\s*<\/[A-Z]/

const mdxStructure = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = this.build(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged) this.decorations = this.build(u.view)
    }
    build(view: EditorView): DecorationSet {
      const b = new RangeSetBuilder<Decoration>()
      const doc = view.state.doc

      let fmEnd = 0
      if (doc.lines >= 2 && doc.line(1).text.trim() === '---') {
        for (let i = 2; i <= doc.lines; i++) {
          if (doc.line(i).text.trim() === '---') {
            fmEnd = i
            break
          }
        }
      }
      if (fmEnd > 0) {
        for (let i = 1; i <= fmEnd; i++) {
          const line = doc.line(i)
          b.add(line.from, line.from, i === 1 || i === fmEnd ? fmFence : fmLine)
        }
      }

      let inFence = false
      for (let i = fmEnd + 1; i <= doc.lines; i++) {
        const line = doc.line(i)
        if (FENCE_RE.test(line.text.trimStart())) {
          inFence = !inFence
          continue
        }
        if (inFence) continue
        if (JSX_OPEN_RE.test(line.text) || JSX_CLOSE_RE.test(line.text)) {
          b.add(line.from, line.from, jsxLine)
        }
      }

      return b.finish()
    }
  },
  { decorations: (v) => v.decorations },
)

type Props = {
  value: string
  onChange: (v: string) => void
  /**
   * Optional image upload hook. When provided, paste/drop of image
   * files is intercepted: each file is handed to this callback and the
   * returned URL is inserted as `![](url)` at the cursor.
   */
  onImageUpload?: (file: File) => Promise<string | null>
  /**
   * Optional GitHub blob-URL importer. When provided, pasting a
   * `github.com/.../blob/...#Lx-Ly` URL is intercepted: the callback
   * fetches the source range and returns the markdown to insert (a code
   * fence with attribution meta), or null to skip.
   */
  onGithubCite?: (url: string) => Promise<string | null>
}

/**
 * Replace the current selection with the given text and move the cursor to the end of the insertion.
 *
 * @param view - The CodeMirror EditorView whose document will be changed
 * @param text - The text to insert in place of the current selection
 */
function insertText(view: EditorView, text: string): void {
  view.dispatch(
    view.state.changeByRange((range) => ({
      changes: { from: range.from, to: range.to, insert: text },
      range: EditorSelection.cursor(range.from + text.length),
    })),
  )
}

/**
 * Upload files and insert a Markdown image (`![](url)`) at the current selection for each successful upload.
 *
 * @param view - The EditorView to insert image markup into
 * @param files - Image files to upload and insert
 * @param upload - Async uploader that returns the image URL on success or `null` to skip insertion
 */
async function insertImages(
  view: EditorView,
  files: File[],
  upload: (file: File) => Promise<string | null>,
): Promise<void> {
  for (const file of files) {
    const url = await upload(file)
    if (!url) continue
    insertText(view, `![](${url})`)
  }
}

const theme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--paper-raised)',
    color: 'var(--ink)',
    height: '100%',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.7',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: 'var(--brand)',
  },
  '.cm-line': {
    paddingLeft: '14px',
    position: 'relative',
  },
  // Subtle left rail on the focused line — no block tint, no IDE feel.
  '.cm-line.cm-focusLine::before': {
    content: '""',
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    width: '2px',
    backgroundColor: 'var(--brand)',
    opacity: '0.55',
  },
  // Frontmatter region reads as set-aside metadata, not prose.
  '.cm-line.cm-frontmatter, .cm-line.cm-frontmatter-fence': {
    color: 'var(--ink-faint)',
  },
  '.cm-line.cm-frontmatter-fence': {
    color: 'var(--ink-faint)',
    opacity: '0.55',
  },
  // MDX component lines feel like quoted invocations — slightly cooler.
  '.cm-line.cm-mdx-component': {
    color: 'var(--ink-muted)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--ink-faint)',
    border: 'none',
    fontVariantNumeric: 'tabular-nums',
    paddingRight: '12px',
    fontSize: '11px',
  },
  '.cm-focusLineGutter': {
    color: 'var(--ink-muted)',
  },
  '.cm-fold-marker': {
    color: 'var(--ink-faint)',
    cursor: 'pointer',
    fontSize: '9px',
    paddingInline: '2px',
  },
  '.cm-fold-marker:hover': {
    color: 'var(--ink-muted)',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: '1px dashed var(--rule)',
    color: 'var(--ink-faint)',
    padding: '0 0.4em',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--selection)',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--selection)',
  },
  '.cm-cursor': { borderLeftColor: 'var(--brand)' },
})

// Restrained palette: headings get real size hierarchy, prose stays
// ink, markdown marks (#, *, _, [, ], (, )) fade to ink-faint so the
// content reads first and the structure reads second. We don't paint
// the syntactic scaffolding in brand — that would be IDE energy.
const highlightStyle = HighlightStyle.define([
  {
    tag: t.heading1,
    color: 'var(--ink)',
    fontWeight: '700',
    fontSize: '1.35em',
  },
  {
    tag: t.heading2,
    color: 'var(--ink)',
    fontWeight: '700',
    fontSize: '1.18em',
  },
  {
    tag: t.heading3,
    color: 'var(--ink)',
    fontWeight: '600',
    fontSize: '1.06em',
  },
  { tag: t.heading4, color: 'var(--ink)', fontWeight: '600' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.link, color: 'var(--ink)' },
  { tag: t.url, color: 'var(--ink-faint)' },
  { tag: t.monospace, color: 'var(--ink-muted)' },
  { tag: t.quote, color: 'var(--ink-muted)', fontStyle: 'italic' },
  { tag: t.processingInstruction, color: 'var(--ink-faint)' },
  { tag: t.meta, color: 'var(--ink-faint)' },
  { tag: t.contentSeparator, color: 'var(--ink-faint)' },
  { tag: t.comment, color: 'var(--ink-faint)', fontStyle: 'italic' },
  { tag: t.string, color: 'var(--ink-muted)' },
  { tag: t.keyword, color: 'var(--ink)', fontWeight: '600' },
])

type Heading = { line: number; level: number; text: string }

/**
 * Extracts Markdown headings from a source string, preserving their line numbers and levels.
 *
 * Scans the document for ATX-style headings (`#` through `######`), ignoring content inside a leading YAML frontmatter block and fenced code blocks. Each heading's text excludes the leading hashes and surrounding trailing whitespace.
 *
 * @param source - The Markdown/MDX source text to scan.
 * @returns An array of headings where each entry contains `line` (1-based line number), `level` (1–6 number of `#`), and `text` (heading title).
 */
function extractHeadings(source: string): Heading[] {
  const out: Heading[] = []
  const lines = source.split('\n')
  let inFence = false
  let inFrontmatter = false
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i] ?? ''
    if (i === 0 && text.trim() === '---') {
      inFrontmatter = true
      continue
    }
    if (inFrontmatter) {
      if (text.trim() === '---') inFrontmatter = false
      continue
    }
    if (text.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = text.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (m && m[1] && m[2]) {
      out.push({ line: i + 1, level: m[1].length, text: m[2] })
    }
  }
  return out
}

/**
 * Render a CodeMirror-based markdown/MDX editor with custom decorations, shortcuts, image handling, and a heading navigator.
 *
 * The editor supports wrapping shortcuts (bold/italic/code), converting selections into markdown links, highlighting frontmatter and MDX component lines, and selecting the active line. When `onImageUpload` is provided, pasted or dropped image files are uploaded and inserted as `![](url)`; when `onGithubCite` is provided, pasted GitHub blob URLs are converted to markdown via the callback and inserted. The heading navigator can be toggled with Ctrl/Meta+Shift+O and jumps the editor to the selected heading.
 *
 * @param value - The controlled editor text value.
 * @param onChange - Callback invoked with the new document text whenever the editor content changes.
 * @param onImageUpload - Optional. Receives an image `File` and should return a Promise resolving to an uploaded URL string or `null`. When present, pasted/dropped images are uploaded and inserted as markdown image links.
 * @param onGithubCite - Optional. Receives a GitHub blob URL and should return a Promise resolving to markdown text or `null`. When present, pasted GitHub blob URLs are converted to markdown and inserted.
 * @returns The React element mounting the editor.
 */
export default function Editor({
  value,
  onChange,
  onImageUpload,
  onGithubCite,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onImageUploadRef = useRef(onImageUpload)
  onImageUploadRef.current = onImageUpload
  const onGithubCiteRef = useRef(onGithubCite)
  onGithubCiteRef.current = onGithubCite
  const [navOpen, setNavOpen] = useState(false)
  const headings = useMemo(() => extractHeadings(value), [value])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 'o' || e.key === 'O')
      ) {
        e.preventDefault()
        setNavOpen((v) => !v)
      } else if (e.key === 'Escape' && navOpen) {
        setNavOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  const jumpToLine = (line: number) => {
    const view = viewRef.current
    if (!view) return
    const li = view.state.doc.line(line)
    view.dispatch({
      selection: { anchor: li.from },
      effects: EditorView.scrollIntoView(li.from, { y: 'start' }),
    })
    view.focus()
    setNavOpen(false)
  }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const imageDrop = EditorView.domEventHandlers({
      paste(event, view) {
        const upload = onImageUploadRef.current
        if (upload) {
          const files: File[] = []
          for (const item of event.clipboardData?.items ?? []) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              const f = item.getAsFile()
              if (f) files.push(f)
            }
          }
          if (files.length > 0) {
            event.preventDefault()
            void insertImages(view, files, upload)
            return true
          }
        }
        const cite = onGithubCiteRef.current
        if (cite) {
          const text = event.clipboardData?.getData('text/plain')?.trim() ?? ''
          if (
            text &&
            /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\//.test(text)
          ) {
            event.preventDefault()
            void cite(text).then((md) => {
              if (md) insertText(view, md)
            })
            return true
          }
        }
        return false
      },
      drop(event, view) {
        const upload = onImageUploadRef.current
        if (!upload) return false
        const dt = event.dataTransfer
        if (!dt) return false
        const files = Array.from(dt.files).filter((f) =>
          f.type.startsWith('image/'),
        )
        if (files.length === 0) return false
        event.preventDefault()
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
        if (pos !== null) {
          view.dispatch({ selection: { anchor: pos } })
        }
        void insertImages(view, files, upload)
        return true
      },
    })

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        foldGutter({
          markerDOM: (open) => {
            const span = document.createElement('span')
            span.className = 'cm-fold-marker'
            span.textContent = open ? '▾' : '▸'
            return span
          },
        }),
        history(),
        focusLine,
        mdxStructure,
        markdown(),
        syntaxHighlighting(highlightStyle),
        mdShortcuts,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        theme,
        EditorView.lineWrapping,
        imageDrop,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({ state, parent: host })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // mount once; value sync handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    })
  }, [value])

  return (
    <div className="relative h-full min-h-0">
      <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />
      {navOpen ? (
        <HeadingNav
          headings={headings}
          onSelect={jumpToLine}
          onClose={() => setNavOpen(false)}
        />
      ) : null}
    </div>
  )
}

/**
 * Renders a searchable, keyboard-navigable overlay for jumping to document headings.
 *
 * Displays `headings` in a filterable list, supports arrow-key navigation, Enter to select,
 * and Escape to close the overlay.
 *
 * @param headings - Array of heading objects to display (each with `line`, `level`, and `text`).
 * @param onSelect - Called with the selected heading's line number when the user activates an item.
 * @param onClose - Called to request closing the overlay (also invoked on Escape).
 * @returns The heading navigation overlay element.
 */
function HeadingNav({
  headings,
  onSelect,
  onClose,
}: {
  headings: Heading[]
  onSelect: (line: number) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? headings.filter((h) => h.text.toLowerCase().includes(q))
      : headings
  }, [query, headings])

  useEffect(() => {
    setActive(0)
  }, [query])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = filtered[active]
      if (target) onSelect(target.line)
    }
  }

  return (
    <div
      onKeyDown={handleKey}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[440px] max-w-[92%] bg-paper border border-rule rounded-sm shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="p-3 border-b border-rule">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="go to heading…"
          className="w-full bg-transparent focus:outline-none text-sm placeholder:text-ink-faint"
        />
      </div>
      <ul className="max-h-72 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-ink-faint italic text-xs">
            No matching headings
          </li>
        ) : (
          filtered.map((h, i) => (
            <li key={`${h.line}-${h.text}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => onSelect(h.line)}
                style={{ paddingLeft: `${0.75 + (h.level - 1) * 0.85}rem` }}
                className={cn(
                  'w-full text-left pr-3 py-1 text-sm transition-colors',
                  i === active
                    ? 'bg-paper-raised text-ink'
                    : 'text-ink-muted',
                )}
              >
                <span className="font-mono text-[10px] text-ink-faint mr-2">
                  H{h.level}
                </span>
                {h.text}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

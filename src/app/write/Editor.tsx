import { useEffect, useRef } from 'react'
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
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

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
}

async function insertImages(
  view: EditorView,
  files: File[],
  upload: (file: File) => Promise<string | null>,
): Promise<void> {
  for (const file of files) {
    const url = await upload(file)
    if (!url) continue
    const insert = `![](${url})`
    view.dispatch(
      view.state.changeByRange((range) => ({
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.cursor(range.from + insert.length),
      })),
    )
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

export default function Editor({ value, onChange, onImageUpload }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onImageUploadRef = useRef(onImageUpload)
  onImageUploadRef.current = onImageUpload

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const imageDrop = EditorView.domEventHandlers({
      paste(event, view) {
        const upload = onImageUploadRef.current
        if (!upload) return false
        const files: File[] = []
        for (const item of event.clipboardData?.items ?? []) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const f = item.getAsFile()
            if (f) files.push(f)
          }
        }
        if (files.length === 0) return false
        event.preventDefault()
        void insertImages(view, files, upload)
        return true
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
        history(),
        focusLine,
        mdxStructure,
        markdown(),
        syntaxHighlighting(highlightStyle),
        mdShortcuts,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
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

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />
}

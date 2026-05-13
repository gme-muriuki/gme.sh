import { useEffect, useRef } from 'react'
import { EditorSelection, EditorState } from '@codemirror/state'
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  keymap,
} from '@codemirror/view'
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
    lineHeight: '1.65',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: 'var(--brand)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--ink-faint)',
    border: 'none',
    fontVariantNumeric: 'tabular-nums',
    paddingRight: '12px',
    fontSize: '11px',
  },
  '.cm-activeLine': { backgroundColor: 'var(--code-tint)' },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
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

const highlightStyle = HighlightStyle.define([
  { tag: t.heading1, color: 'var(--ink)', fontWeight: '600' },
  { tag: t.heading2, color: 'var(--ink)', fontWeight: '600' },
  { tag: t.heading3, color: 'var(--ink)', fontWeight: '500' },
  { tag: t.keyword, color: 'var(--brand)' },
  { tag: t.string, color: 'var(--ink-muted)' },
  { tag: t.comment, color: 'var(--ink-faint)', fontStyle: 'italic' },
  { tag: t.meta, color: 'var(--ink-faint)' },
  { tag: t.url, color: 'var(--brand)' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: '600' },
  { tag: t.link, color: 'var(--brand)' },
  { tag: t.monospace, color: 'var(--ink-muted)' },
  { tag: t.processingInstruction, color: 'var(--ink-faint)' },
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
        highlightActiveLine(),
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

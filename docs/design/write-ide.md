# /write IDE

**Status:** Draft (sections 1–4 agreed; editor integration, meta panel, responsive drawer, deferred items still open)
**Date:** 2026-05-12

## Context

The brief asks for a `/write` route that's "the writing surface" for the author — side-by-side editor + live MDX preview, same templates the public blog uses, the full MDX feature set (diffs, sidenotes, callouts, math, Mermaid). Current implementation is a two-column `<textarea>` + preview, with metadata in a top toolbar. A reference image specifies a four-column IDE: file tree, code editor with line numbers + syntax highlighting, rendered preview, metadata sidebar.

In-blog only — no save-to-disk, no auth (production assumption is auth-gated; the prototype is read-only against existing MDX sources).

## Decision (so far)

### Architecture & scope

Single SPA route at `/write`, **rendered outside the global `Layout`** (same pattern as `/og/:slug`). `ThemeProvider` still wraps it. The IDE owns the viewport — no global Header/Footer.

Editor is the canonical source of truth. The sidebar reads parsed frontmatter for display and writes through a single `setSource` mutator that re-serializes the `---...---` block in place. Posts loaded from `import.meta.glob('@/content/**/*.mdx', { query: '?raw', import: 'default' })`.

File layout under `src/app/write/`:

| file | role |
| --- | --- |
| `Write.tsx` | page shell, owns state, lazy-loads `Editor` |
| `Sidebar.tsx` | left file tree, grouped by post type |
| `Editor.tsx` | CodeMirror 6 wrapper |
| `MetaPanel.tsx` | right metadata sidebar |
| `Preview.tsx` | rendered preview, uses `useMdxEval(parsed.body)` |
| `Toolbar.tsx` | top bar: path crumb, Edit/Preview tabs, search |
| `frontmatter.ts` | `parse` + `serialize`, `js-yaml` backed |
| `sources.ts` | raw MDX index keyed by `${type}/${slug}` |

### Aesthetic spine

Two visual worlds meet at the editor: the **field notebook** (preview pane, public-post typography unchanged) clamped to a **terminal rail** (tree, top bar, editor pane).

- Tree: flat path entries (`essays/hash-map-allocator.mdx`) in mono; sections separated by `■`; active row uses the `nav-active` underline treatment.
- Top bar: `$ edit essays/...` in the existing `term-status` motif; tabs styled like primary Nav links.
- Editor: custom CodeMirror theme bound to existing CSS tokens — `var(--paper-raised)` bg, `var(--ink)` text, `var(--selection)` highlight, gutter in `var(--ink-faint)` tabular mono.
- Meta panel: one-line entries — mono micro-caps label over ink value, `border-rule/60` hairline between. No chip soup. `■` divides sections (Identity / Schedule / Type-specific).
- Reuses `chrome-frame`, `term-status`, `wordmark`, `nav-active`, `SquareMark`. No new aesthetic surface area.

### Layout & breakpoints

```
┌─ topbar 40px ──────────────────────────────────────────────────┐
│ ■ James Muriuki  $ edit essays/hash-map.mdx  EDIT|PREVIEW  ⌘K  │
├──────────┬─────────────────────┬───────────────┬───────────────┤
│ sidebar  │ editor              │ preview       │ meta          │
│ 220px    │ flex, min 0         │ flex, min 0   │ 300px         │
└──────────┴─────────────────────┴───────────────┴───────────────┘
```

- ≥1440px — full four-column.
- 1024–1439px — collapse right `meta` to a slide-in panel toggled by a "Document" pill.
- 768–1023px — also collapse left `sidebar` to a slide-in.
- <768px — center collapses to one pane via the Edit/Preview tabs; both side panels drawer-only.

Desktop-first because `/write` is author-only. Mobile usable, not pretty.

Edit | Preview tabs on desktop act as a **focus-mode toggle**: EDIT shows the four-column layout; PREVIEW collapses the editor and expands the preview pane to fill the center, mirroring the public post page (good for read-through passes). Sidebar and meta panel remain available.

### State model

```ts
const [currentFile, setCurrentFile] = useState<{ type: PostType; slug: string } | null>(null)
const [source, setSource] = useState<string>(() => TEMPLATES.essay)
const [mode, setMode] = useState<'edit' | 'preview'>('edit')
const [panels, setPanels] = useState({ left: true, right: true })

const parsed = useMemo(() => parseFrontmatter(source), [source])
const deferredSource = useDeferredValue(source)
```

Split `useState`s (`rerender-split-combined-hooks`), derived via `useMemo` not effects (`rerender-derived-state-no-effect`), preview compile deferred (`rerender-use-deferred-value`), lazy init (`rerender-lazy-state-init`).

Sidebar fields don't own state — they read `parsed.frontmatter` and write through:

```ts
const updateFrontmatter = useCallback((patch: Partial<Frontmatter>) => {
  setSource(s => {
    const { frontmatter, body } = parseFrontmatter(s)
    return serializeFrontmatter({ ...frontmatter, ...patch }, body)
  })
}, [])
```

Sidebar writes commit on blur or 280ms idle, not per keystroke. Tree-click replaces `source` silently — no unsaved-changes guard in MVP since there's no save.

### Frontmatter parse / serialize

`src/app/write/frontmatter.ts`, backed by `js-yaml`. Pure:

```ts
export function parseFrontmatter(source: string): {
  frontmatter: Partial<Frontmatter>
  body: string
  error: string | null
}

export function serializeFrontmatter(
  fm: Partial<Frontmatter>,
  body: string,
): string
```

- No fence in source → empty frontmatter, full source is body.
- Malformed YAML → `error` surfaces in meta panel; sidebar values stay blank until source parses.
- Round-trip — `parse → serialize → parse` is idempotent for any frontmatter the sidebar can produce. We don't preserve user-authored YAML formatting; sidebar edits normalize to block-style arrays + minimal quoting.
- Unknown keys (`lastTended`, `series`, `hero`, `links`, `draft`) survive sidebar edits because they're patched, not replaced.
- Preview pipeline: `useMdxEval(parsed.body)` — never sees the frontmatter fence. The preview wrapper layout (`EssayLayout` / `NoteLayout` / `ShippedLayout`) takes its props from `parsed.frontmatter`.

## Open

- Editor integration (CodeMirror 6: extensions, theming, gutter)
- Meta panel field schema by post type
- Responsive drawer behaviour and gesture
- Deferred items: "new draft" templates, frontmatter error UX, modified badge

## Performance rules applied

`bundle-dynamic-imports`, `bundle-barrel-imports`, `rerender-no-inline-components`, `rerender-use-deferred-value`, `rerender-split-combined-hooks`, `rerender-lazy-state-init`, `rerender-derived-state-no-effect`.

## Rejected alternatives

- **Monaco editor.** ~2 MB; overkill, hard to theme to the paper/ink palette.
- **Textarea + CSS line numbers only.** No syntax highlighting — the reference clearly wants colored MDX.
- **Editor body-only, sidebar canonical.** Splits the source of truth; sidebar drift vs editor becomes an ongoing reconciliation problem.
- **Keep `/write` inside the global `Layout`.** Header/Footer eat vertical real estate; the IDE wants the full viewport.

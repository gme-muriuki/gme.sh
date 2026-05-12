# /write IDE

**Status:** Accepted
**Date:** 2026-05-12
**Branch:** `write-ide`

## Context

The brief asks for a `/write` route that's "the writing surface" for the author — side-by-side editor + live MDX preview, same templates the public blog uses, the full MDX feature set (diffs, sidenotes, callouts, math, Mermaid). Current implementation is a two-column `<textarea>` + preview, with metadata in a top toolbar. A reference image specifies a four-column IDE: file tree, code editor with line numbers + syntax highlighting, rendered preview, metadata sidebar.

In-blog only — no save-to-disk, no auth (production assumption is auth-gated; the prototype is read-only against existing MDX sources).

## Decision

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
| `templates.ts` | empty-doc templates per post type |

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

### Editor (CodeMirror 6)

`Editor.tsx` is **lazy-loaded** via `React.lazy` from `Write.tsx` so the CodeMirror bundle only ships when `/write` opens. Imports are direct, no barrels:

```ts
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
```

Theme is hand-written, bound to existing CSS variables — `var(--paper-raised)` bg, `var(--ink)` text, `var(--selection)` highlight, gutter in `var(--ink-faint)` tabular mono, cursor in `var(--brand)`, active line in `var(--code-tint)`.

Syntax highlight is semantic — `t.heading*` ink + weight, `t.keyword` brand, `t.string` ink-muted, `t.comment` ink-faint italic, `t.meta` (frontmatter YAML) ink-faint mono.

Props: `{ value: string; onChange: (v: string) => void }`. Internally a single `EditorView` plus an effect that, when `value` changes from outside, dispatches a `transaction` replacing the doc only if it differs from the view's current content — preserves cursor when the parent re-renders for unrelated reasons; replaces wholesale when the user tree-clicks another file.

Extensions in MVP: `lineNumbers`, `highlightActiveLine`, `history`, `markdown()`, custom theme, custom highlight style, `keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab])`.

Status line below editor: `chars · words · live|compiling|error` in `term-status`, fed by `useMdxEval`'s `pending`/`error` state.

Not in MVP: vim mode, autocomplete, linting, find/replace, multi-cursor configuration beyond defaults, fenced-code-inside-MDX highlighting.

### MetaPanel schema

Sections divided by ■, each section a stack of one-line fields. All inputs are bottom-rule only (no boxes); errors render as a brand-coloured mono micro-caps banner at the top of the panel.

| Section | Field | Input | Frontmatter key | Notes |
| --- | --- | --- | --- | --- |
| Identity | Title | text | `title` | required |
| Identity | Dek | text | `dek` | optional |
| Identity | Tags | text → array | `tags` | comma-split, normalize on blur |
| Schedule | Date | `<input type="date">` | `date` | defaults to today on new |
| Schedule | Status | select | `draft` | values: draft (true) / published (false) |
| Schedule | Reading time | number | `readingTime` | optional |
| Type | Type | segmented | n/a (drives conditional fields) | essay / note / shipped |
| Note | Growth | select | `growth` | seedling / growing / evergreen, only if type=note |
| Note | Last tended | date | `lastTended` | optional |
| Shipped | Hero | URL | `hero` | optional |
| Shipped | Links | repeater | `links` | minimal +/− UI |
| Advanced | Series | name + index + total | `series` | collapsed by default |
| Advanced | Frontmatter preview | read-only `<pre>` | — | derived from current source |

Field component: `<Field label={...}>` extracted from current `Write.tsx`.

### Responsive drawers

Side panels (`sidebar`, `meta`) are the same components at all breakpoints; only the *container* changes:

- Wide (≥1440): both rendered as fixed columns in the grid.
- Mid (1024–1439): `meta` rendered inside a Radix `Dialog` as a right-edge slide-in. Top-bar pill "Document" toggles `panels.right`.
- Narrow (768–1023): `sidebar` also a Dialog from the left. Top-bar pill "Files" toggles `panels.left`.
- Mobile (<768): same drawers; center pane respects `mode`.

Tabs in the top bar are a segmented control styled like Nav primary links. Visible always. Their effect:
- Desktop wide: focus-mode (PREVIEW collapses editor, expands preview).
- Mobile: switches the only visible center pane.

No animation library — Radix Dialog handles the slide; `prefers-reduced-motion` already short-circuits transitions globally.

## MVP / Deferred

**In MVP:** four-column layout, file tree (load source on click), CodeMirror editor with theme + line numbers + history, live preview via `useMdxEval`, MetaPanel with all fields above, parse/serialize with error surfacing, focus-mode tabs, responsive drawers, "new draft" templates per type.

**Deferred:** search/replace, vim mode, multi-doc tabs, autosave, "modified vs source" badge, frontmatter schema validation beyond parse errors, drag-resize between panes, syntax highlighting for fenced code inside MDX, save-to-disk via dev-server endpoint.

## Performance rules applied

`bundle-dynamic-imports` (lazy Editor), `bundle-barrel-imports` (direct CodeMirror packages), `rerender-no-inline-components` (split into per-concern files), `rerender-use-deferred-value` (preview compile), `rerender-split-combined-hooks` (state by cadence), `rerender-lazy-state-init` (templates), `rerender-derived-state-no-effect` (parse memo), `rerender-functional-setstate` (frontmatter patches).

## Rejected alternatives

- **Monaco editor.** ~2 MB; overkill, hard to theme to the paper/ink palette.
- **Textarea + CSS line numbers only.** No syntax highlighting — the reference clearly wants colored MDX.
- **Editor body-only, sidebar canonical.** Splits the source of truth; sidebar drift vs editor becomes an ongoing reconciliation problem.
- **Keep `/write` inside the global `Layout`.** Header/Footer eat vertical real estate; the IDE wants the full viewport.
- **Vertical editor/preview split inside the center column.** Reference shows horizontal; vertical would compress comfortable reading widths in both panes.

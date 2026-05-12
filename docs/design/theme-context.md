# Theme context

**Status:** Accepted
**Date:** 2026-05-12
**Commit:** `5cd78d1`

## Context

Theme state lived in a `useTheme` hook called once by `ThemeToggle`. `Mermaid` needed the resolved theme too and reached for it via its own `MutationObserver` on `document.documentElement`'s class list — one observer per diagram, all re-rendering on the same toggle. The class-watching pattern doesn't port cleanly to a future Next.js SSR build.

## Decision

Lift `useTheme` into a `<ThemeProvider>` context. `ThemeToggle` and `Mermaid` both read `useTheme()` from the provider. Drop the per-instance `MutationObserver`. Extend `apply(resolved)` to write `meta[name=theme-color]` so the browser chrome matches paper / near-black. The inline no-flash script in `index.html` writes the same meta on first paint to avoid a one-frame mismatch.

## Consequences

- One source of truth for resolved theme; N mermaid diagrams share one re-render path.
- Idiomatic React; portable to RSC where module-level DOM observers wouldn't work.
- `useTheme()` now throws if called outside `<ThemeProvider>` — minor cost paid by component test scaffolding (none yet).
- Inline-script and `apply()` share two literal hex strings (`#FAF7F0`, `#1A1714`). Drift risk; mitigated by a comment in `useTheme.tsx` pointing at `index.html`.

## Rejected alternatives

- **Module-level pub/sub store.** Smaller diff than context, but the project has no other store and adds a non-idiomatic pattern.
- **Shared `MutationObserver` inside `Mermaid.tsx`.** Smallest blast radius. Doesn't generalise, keeps the class-watching hack.

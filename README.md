# blog

Design prototype for a personal technical blog. React + Vite + Tailwind v4 + MDX.

Production target: Next.js + MDX. This artifact exists so the design is navigable in a real browser before the port.

## Dev

```
pnpm install
pnpm dev
```

## Stack

- Vite 6 + React 18
- Tailwind v4 (`@tailwindcss/vite`)
- MDX via `@mdx-js/rollup` (added in commit 6)
- Shiki (Catppuccin Latte / Mocha) for code highlighting
- react-router 7
- cmdk + fuse.js for Cmd+K search

Brief lives at `src/imports/pasted_text/blog-prototype-design.md`.

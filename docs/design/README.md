# Design

One markdown file per non-trivial design decision. ADR-lite format:

- **Status** — Accepted / Proposed / Superseded
- **Date** — ISO date
- **Context** — what forced the call
- **Decision** — what we chose, in one or two sentences
- **Consequences** — what it costs us, what it earns us
- (optional) **Rejected alternatives** — what we passed on and why

Skip docs for mechanical cleanups (rename, lint, dependency bumps). Document anything that changes architecture, public shape, or aesthetic direction.

## Index

- [theme-context](./theme-context.md) — lift theme state into React context; sync `meta[name=theme-color]`. *Accepted*
- [write-ide](./write-ide.md) — `/write` route rebuilt as a 4-pane IDE with CodeMirror + live preview. *Draft*

import type { PostType } from '@/app/content-index'

/**
 * Produces the current date string formatted as YYYY-MM-DD.
 *
 * @returns The current date in `YYYY-MM-DD` format (UTC)
 */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Generate a ready-to-edit Markdown/MDX post template for the given post type.
 *
 * The returned string contains YAML frontmatter (with today's date) and a scaffolded body appropriate to the selected `type`.
 *
 * @param type - The post kind to generate: `'essay'`, `'note'`, `'shipped'`, or `'page'`
 * @returns A Markdown/MDX document string with YAML frontmatter (including today's date) followed by a scaffolded body
 */
export function makeTemplate(type: PostType): string {
  const date = today()
  switch (type) {
    case 'essay':
      return `---
title: Untitled essay
date: ${date}
dek: ""
tags: []
readingTime: 8
---

Open with one tight paragraph. The reader is on the fence about whether to keep going — earn the next click here, not in the heading.

## A section heading

Body copy with an inline aside.<Sidenote>The right rail on desktop, popover on mobile.</Sidenote>

\`\`\`rust src/lib.rs
fn allocate(layout: Layout) -> *mut u8 {
    System.alloc(layout)
}
\`\`\`

<Callout type="note">
Callouts use a quiet brand-edged frame.
</Callout>
`
    case 'note':
      return `---
title: Untitled note
date: ${date}
growth: seedling
tags: []
---

What I'm chewing on. A note is short, looser, and dated — its job is to think out loud.
`
    case 'shipped':
      return `---
title: Untitled release
date: ${date}
dek: ""
tags: []
links:
  - label: repo
    href: https://github.com/
---

A short release note. What it is, why it exists, where to get it.
`
    case 'page':
      return `---
title: Untitled page
date: ${date}
---

A static page.
`
  }
}

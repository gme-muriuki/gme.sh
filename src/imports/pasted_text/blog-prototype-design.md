I'm building a personal technical blog. I write about Rust, systems programming, half-baked ideas I'm chewing on, and announcements for products I'm shipping. Audience: technical readers who follow Amos (fasterthanli.me), Julia Evans, Dan Luu, Maggie Appleton, and the Rust core team. Low tolerance for marketing voice; zero patience for "Hi, I'm X!" hero sections.

The production blog will be Next.js + MDX. This prototype is the design — build it as a navigable React artifact using Tailwind, with realistic mock content. Every page listed below must be clickable and complete inside the artifact.

Core principle: the page is the content
No greeting banner. No author photo on the home page. No "I write about X, Y, Z" intro box. No newsletter modal. No "Trusted by" / "As featured in." The visitor's eye should land on a real post title within the first viewport.

Identity
Name: James Muriuki. Handle: @gme (used in social and author tags).
Wordmark: name set in the body serif as small caps with light letter-spacing, surname slightly heavier than the given name (magazine-masthead move). Lives top-left, modest size.
Companion mark: a small filled square ■ in the accent color. Used in the favicon, footer, and as a separator in metadata rows (Essay ■ Nov 2026 ■ 12 min). Subtle programmer wink — reads as a monospace grid / tofu glyph.
No tagline. No mission statement.
Color
Accent: burnt sienna 
#A8541E in light mode, shifting to ~
#D97757 in dark mode. Used surgically — links, the SHIPPED label, the ■ mark, inline-code tint, callout accents. Nothing else gets to be colored.
Light: paper background 
#FAF7F0, ink 
#1F1B16. Never pure white, never pure black.
Dark: warm near-black background ~
#1A1714, ink ~
#E8E2D5. Easy on the eyes, low-contrast, not "OLED black."
Default to light, toggle respects system preference. Toggle is a small icon in the header — discoverable but understated.
Typography
Body serif: Source Serif 4, Tiempos Text, Charter, or Iowan Old Style. Pick one and commit. Line-height 1.65–1.75, measure ~68 characters per line.
Monospace: Berkeley Mono if available; otherwise JetBrains Mono, IBM Plex Mono, or Geist Mono. Heavy use throughout — code, inline code, metadata.
Headlines: the body serif at scale, or a confident sans companion if it earns its place.
Real typographic hierarchy: vary scale, weight, tracking.
Three post types — visually distinct
Each gets its own visual treatment, its own index page, and its own nav item. Navigation reads: Essays · Notes · Shipped · Projects · Uses · Now · Reading · Talks · About.

Essays — long-form technical deep dives. Editorial gravity, full reading-aid kit.
Notes — half-baked ideas, in-progress thinking. Field-notebook feel: shorter, less formal, looser layout. Each note carries a growth-stage indicator (seedling / growing / evergreen) and a "last tended" date alongside the published date.
Shipped — product launches and project releases. Distinct framing: a clear SHIPPED label in the accent color, room for a product hero image, links to repo / docs / demo, optional changelog. Should look like a release, not a blog post.
Code blocks — the full kit
Style should evoke a clean PR review, not a loud highlighter party.

Syntax highlighting: muted, considered palette (Catppuccin, Nord, Tokyo Night, or custom). Not default GitHub colors. Rust syntax must look gorgeous specifically.
Diffs: git diff styling — added lines on a quiet green tint with + in the gutter, removed on quiet red with −, file header at top, unchanged context in a softer color.
Line highlighting: specific lines emphasized with a subtle background band.
Inline annotations: small accent-colored notes pointing at specific lines (numbered markers in the gutter; notes appear below the block or in the margin).
File tabs for multi-file examples.
Terminal/output blocks: distinct from code — $  prompt prefix, no syntax highlight, slightly darker background, no line numbers.
File-path label at the top (e.g., src/allocator.rs).
Copy button in the top-right of every block.
Language tag in the top-right corner.
Line numbers optional, available.
Inline code: subtle background tint in the accent family, never shouty.
Reading aids
Sidenotes / margin footnotes — Tufte-style. On desktop, in the right margin next to the triggering line. On mobile, inline expandable popovers.
Math — KaTeX, inline and display.
Diagrams — Mermaid (flowcharts, sequence, state machines). Restyled to match the site palette, not Mermaid defaults.
Callout boxes — Note, Warning, Tip, Aside. Quiet treatment: small accent line on the left, single-word label, restrained background.
Pull quotes — large serif, generous space, set off from body.
Embedded interactive demos — styled placeholder container for React/wasm components in posts.
Individual post page
Long-form reading experience. Comfortable measure, generous margins, real vertical rhythm.

Header: title, optional dek, date, reading time, post-type tag. Notes also show growth stage + "last tended." Shipped shows SHIPPED label + release date.
For long essays: quietly sticky table of contents — sidebar on desktop, collapsible top sheet on mobile.
Reading progress indicator at the top, almost invisible until you notice it.
Series navigator: if the post is part of a series ("Writing an allocator, Part 2 of 4"), compact block at top and bottom listing all parts.
End of post: tags, permalink line, then a Giscus comments section (GitHub Discussions) styled to match the site palette, not default Giscus.
Home page
Open with work. Most-recent essay teased prominently (title, dek, date, reading time, opening sentences). Below it, three quiet sections: recent Essays, recent Notes (growth indicators visible), recent Shipped. No "About me" block on home. One short manually-updated Currently: line at the top right of the header, one sentence. Wordmark and nav at top; that's the only chrome.

Archive page
Chronological, grouped by year, scannable. No card grid. Each row: date · type · title · one-line description · tags. Optional tag filter, understated.

Adjacent pages — all real, designed, populated
/uses — tools, editor, hardware, dotfiles. Categorized list with brief notes. Living "how I work" document, not a brand-deal page.
/now — what I'm working on this month. One screen. Dated. Past /now entries archived below.
/projects — portfolio-style standing list. Separate from the Shipped stream. Cross-links to relevant Shipped posts.
/talks — conference talks and writing elsewhere. Date · venue · title · link · optional slides/video.
/reading — "Currently reading" (1–3 items) at top, "Recently finished" below. Books, papers, links. One or two sentences of reaction each. Avoid the bloated-Goodreads-list trap.
About page
Short. A few paragraphs in first person with substance, not bio-speak. Optional list of "things I'm thinking about lately." No headshot grid. No "as seen on." No testimonials. Contact line at the bottom (email, GitHub, social) with ■ as separators.

Writing mode (in-blog)
A /write route turning the prototype into a writing surface. Side-by-side: editor (left) and live-rendered post preview (right) using the same post template the public blog uses. Supports the full MDX feature set — code blocks with diffs/highlighting/tabs, sidenotes, callouts, math, Mermaid. Top toolbar: post-type selector (Essay / Note / Shipped), metadata fields (title, dek, tags, series, growth stage), a frontmatter panel for advanced fields. This is for me, not visitors — assume it's behind auth in production. Belongs to the same visual world as the public site, but with editor-appropriate density.

Discovery & subscription
RSS feed — link visible in the footer; small RSS icon in the header.
Tags + tag archive — clicking a tag goes to a filtered archive.
Client-side search — Pagefind-style. Cmd+K / Ctrl+K opens a modal. Lightweight, indexes titles + headings + snippets.
Open Graph card template — designed layout: paper background, name in small caps, post title in large serif, the ■ mark, post-type tag in accent color. Auto-generated per post.
Interactions & motion
Minimal. Smooth scroll. Subtle link hover (slow underline reveal, not color change). Footnote popovers on hover/tap. Quiet reading-progress indicator. No fade-in-on-scroll choreography. No cursor effects. No intro animation on home.

What to actively avoid
Hero sections with headshots. "Hi, welcome to my blog!" intros. Rounded card grids with drop shadows. SaaS gradients / glow / glassmorphism / purple-to-pink. Stock photos. Newsletter popup modals. "Trusted by" social proof. Generic Medium/Ghost/Substack defaults. Anything resembling a startup landing page.

Mock content (populate generously)
Real-feeling posts. No Lorem Ipsum.

Essays (3–4): "A small note on Pin and self-referential structs"; "Why I rewrote my hash map allocator (and you probably shouldn't)"; "Reading the Linux scheduler source, week one"; "On the const-generic future we keep almost having."
Notes (4–6, varied growth): "Half-thoughts on effect systems" (seedling); "Why ? desugars the way it does" (growing); "The case against async fn in traits, revisited" (evergreen); "Reading crossbeam-deque" (seedling); "A vocabulary for thinking about lifetimes" (growing).
Shipped (2–3): "Shipped: rl, a tiny terminal pager in Rust"; "Shipped: nyx, a build-time effect tracker"; one earlier release.
Realistic Rust code samples. At least one essay should exercise all of: diffs, line highlighting, file tabs, terminal blocks, inline annotations, sidenotes, math, a Mermaid diagram, and a callout — so the full system is evaluable in context.
Populate /uses, /now, /projects, /talks, /reading, /about realistically.
Reference points (vibe only)
fasterthanli.me — depth, code typography, sidenote handling
jvns.ca — warmth without overselling
Maggie Appleton — the notes-as-garden concept and growth stages
Stripe Press — book-quality typography
danluu.com — radical content-first restraint (I want more design than this, but the same spirit)
Technical
Single React artifact, Tailwind.
All pages navigable inside the artifact: home, Essays index, one full essay, Notes index, one full note, Shipped index, one full shipped post, archive, /uses, /now, /projects, /talks, /reading, about, /write.
Mobile-first responsive, but desktop is specifically designed — margin sidenotes, sidebar TOC, generous margins only desktop affords.
Real semantic HTML, accessible, keyboard navigable.
Favor patterns that port cleanly to Next.js + MDX.
The bar
The version that lands should make a Rust core developer think "this person has taste" within three seconds. Restraint beats feature count. When in doubt between adding a flourish and removing one, remove.

Show me the design.
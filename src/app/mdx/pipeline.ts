import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeShiki from '@shikijs/rehype'
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers'
import type { ShikiTransformer } from 'shiki'
import type { CompileOptions } from '@mdx-js/mdx'

type PluginList = NonNullable<CompileOptions['remarkPlugins']>

/**
 * Reads fenced-block meta and projects it onto the rendered <pre> via
 * data-* attrs that Pre.tsx renders as figcaption chrome.
 *
 * Recognised forms on the info line, after the language:
 *   ```rust src/lib.rs                                     (bare filename)
 *   ```rust filename=src/lib.rs                            (key=value)
 *   ```rust source=https://github.com/.../blob/...#L1-L20  (github citation)
 *
 * Bare path tokens are kept for backwards compatibility with the
 * pre-citation authoring style.
 */
const transformerMetadata: ShikiTransformer = {
  name: 'metadata',
  pre(node) {
    const lang = this.options.lang
    if (lang) node.properties['data-language'] = lang
    const meta = (this.options.meta as { __raw?: string } | undefined)?.__raw
    if (!meta) return
    for (const tok of meta.split(/\s+/)) {
      if (!tok) continue
      const eq = tok.indexOf('=')
      if (eq < 0) {
        if (/[./]/.test(tok)) node.properties['data-filename'] = tok
        continue
      }
      const key = tok.slice(0, eq)
      const val = tok.slice(eq + 1)
      if (key === 'filename') node.properties['data-filename'] = val
      else if (key === 'source') node.properties['data-source'] = val
    }
  },
}

// Vitesse over catppuccin: lower saturation, designed-for-prose. Reads as
// a cited artifact rather than a coloured IDE buffer pasted into the page.
const shikiOptions = {
  themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
  defaultColor: false,
  transformers: [
    transformerNotationDiff(),
    transformerNotationHighlight(),
    transformerNotationFocus(),
    transformerNotationErrorLevel(),
    transformerMetadata,
  ],
}

const autolinkOptions = {
  behavior: 'wrap',
  properties: { className: ['heading-anchor'] },
} as const

/**
 * Plugin list for the build-time Vite MDX loader. Includes frontmatter
 * parsing because @mdx-js/rollup pulls files from disk and needs to surface
 * the YAML block as a named export on the compiled module.
 */
export const buildTimePlugins: {
  remarkPlugins: PluginList
  rehypePlugins: PluginList
} = {
  remarkPlugins: [
    remarkFrontmatter,
    remarkMdxFrontmatter,
    remarkGfm,
    remarkMath,
  ],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, autolinkOptions],
    rehypeKatex,
    [rehypeShiki, shikiOptions],
  ],
}

/**
 * Plugin list for the runtime @mdx-js/mdx `evaluate()` path used by the
 * /write preview. Frontmatter is stripped from the source before this runs
 * (the parser owns the YAML block, the preview only sees the body), so the
 * frontmatter plugins are omitted.
 */
export const runtimePlugins: {
  remarkPlugins: PluginList
  rehypePlugins: PluginList
} = {
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, autolinkOptions],
    rehypeKatex,
    [rehypeShiki, shikiOptions],
  ],
}

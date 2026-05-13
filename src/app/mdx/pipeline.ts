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
 * Reads `` ```rust src/lib.rs `` style meta on fenced code blocks and
 * attaches the language + filename to the rendered <pre> via data-* attrs.
 * Pre.tsx reads those to render its filename/language chrome.
 */
const transformerMetadata: ShikiTransformer = {
  name: 'metadata',
  pre(node) {
    const lang = this.options.lang
    if (lang) node.properties['data-language'] = lang
    const meta = (this.options.meta as { __raw?: string } | undefined)?.__raw
    if (meta) {
      const tok = meta.split(/\s+/).find((s) => /[./]/.test(s))
      if (tok) node.properties['data-filename'] = tok
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

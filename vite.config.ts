import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
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

// reads `\`\`\`rust src/lib.rs` style meta and attaches filename + language
// to the rendered <pre> so the Pre MDX component can render the chrome.
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

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          remarkMdxFrontmatter,
          remarkGfm,
          remarkMath,
        ],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'wrap',
              properties: { className: ['heading-anchor'] },
            },
          ],
          rehypeKatex,
          [
            rehypeShiki,
            {
              themes: {
                light: 'catppuccin-latte',
                dark: 'catppuccin-mocha',
              },
              defaultColor: false,
              transformers: [
                transformerNotationDiff(),
                transformerNotationHighlight(),
                transformerNotationFocus(),
                transformerNotationErrorLevel(),
                transformerMetadata,
              ],
            },
          ],
        ],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

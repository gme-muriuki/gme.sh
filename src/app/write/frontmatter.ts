import yaml from 'js-yaml'
import type { Frontmatter } from '*.mdx'

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export type ParsedFrontmatter = {
  frontmatter: Partial<Frontmatter>
  body: string
  error: string | null
}

export function parseFrontmatter(source: string): ParsedFrontmatter {
  const m = source.match(FENCE)
  if (!m) return { frontmatter: {}, body: source, error: null }
  const yamlText = m[1] ?? ''
  try {
    const loaded = yaml.load(yamlText) ?? {}
    const fm =
      typeof loaded === 'object' && !Array.isArray(loaded)
        ? (loaded as Partial<Frontmatter>)
        : {}
    return { frontmatter: fm, body: source.slice(m[0].length), error: null }
  } catch (e) {
    return {
      frontmatter: {},
      body: source.slice(m[0].length),
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export function serializeFrontmatter(
  fm: Partial<Frontmatter>,
  body: string,
): string {
  const cleaned = Object.fromEntries(
    Object.entries(fm).filter(([, v]) => {
      if (v === undefined || v === null || v === '') return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    }),
  )
  if (Object.keys(cleaned).length === 0) {
    return body.replace(/^\n+/, '')
  }
  const yamlText = yaml
    .dump(cleaned, {
      lineWidth: 100,
      quotingType: '"',
      forceQuotes: false,
      noRefs: true,
    })
    .trimEnd()
  return `---\n${yamlText}\n---\n\n${body.replace(/^\n+/, '')}`
}

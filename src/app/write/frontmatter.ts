import yaml from 'js-yaml'
import type { RawMdxFrontmatter } from '*.mdx'

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export type ParsedFrontmatter = {
  frontmatter: Partial<RawMdxFrontmatter>
  body: string
  error: string | null
}

/**
 * Extracts a YAML frontmatter block from the start of `source` and returns the parsed frontmatter, the remaining body, and any parse error.
 *
 * @param source - The full document text to inspect for a leading `---` fenced YAML frontmatter block
 * @returns An object with:
 *  - `frontmatter`: the parsed YAML as a `Partial<RawMdxFrontmatter>` if present and an object, otherwise `{}`.
 *  - `body`: the remainder of `source` after the frontmatter fence (or the original `source` when no frontmatter is found).
 *  - `error`: a parse error message if YAML parsing failed, otherwise `null`.
 */
export function parseFrontmatter(source: string): ParsedFrontmatter {
  const m = source.match(FENCE)
  if (!m) return { frontmatter: {}, body: source, error: null }
  const yamlText = m[1] ?? ''
  try {
    const loaded = yaml.load(yamlText) ?? {}
    const fm =
      typeof loaded === 'object' && !Array.isArray(loaded)
        ? (loaded as Partial<RawMdxFrontmatter>)
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

/**
 * Apply a patch to the frontmatter block of a source string and produce an updated source.
 *
 * @param source - The full document text that may contain a YAML frontmatter block.
 * @param patch - Partial frontmatter fields to merge over existing frontmatter; keys in `patch` overwrite existing keys.
 * @returns The document text with the merged frontmatter serialized back into a YAML fence. If the merged frontmatter has no fields, the body is returned without a frontmatter block.
 */
export function patchFrontmatter(
  source: string,
  patch: Partial<RawMdxFrontmatter>,
): string {
  const { frontmatter, body } = parseFrontmatter(source)
  return serializeFrontmatter({ ...frontmatter, ...patch }, body)
}

/**
 * Extracts the YAML content from a leading `---` fenced frontmatter block.
 *
 * @returns The raw YAML text contained between the opening and closing `---` fences, or an empty string if no leading frontmatter block is present.
 */
export function frontmatterText(source: string): string {
  const m = source.match(FENCE)
  return m?.[1] ?? ''
}

/**
 * Serialize a frontmatter object as a YAML `---` fence block and prepend it to the body, or return the body without leading newlines if there is no frontmatter.
 *
 * Omits keys whose value is `undefined`, `null`, the empty string, or an empty array before serializing.
 *
 * @param fm - Partial frontmatter object to serialize
 * @param body - Document body to follow the frontmatter
 * @returns The combined document: a fenced YAML frontmatter block, a blank line, and the body; or the body with leading newlines removed if no frontmatter fields remain
 */
export function serializeFrontmatter(
  fm: Partial<RawMdxFrontmatter>,
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

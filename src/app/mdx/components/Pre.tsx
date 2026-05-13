import { useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { Check, Copy } from 'lucide-react'
import { useInsideFileTabs } from './internal'

type PreProps = ComponentPropsWithoutRef<'pre'> & {
  'data-language'?: string
  'data-filename'?: string
  'data-source'?: string
}

type GithubCitation = {
  repo: string
  ref: string
  path: string
  lineRange: string | null
}

/**
 * Parses a GitHub blob URL and extracts repository, ref, file path, and optional line range.
 *
 * @param url - The URL string to parse.
 * @returns A `GithubCitation` with `repo` as `owner/name`, `ref` as the git ref, `path` as the file path within the repository, and `lineRange` as `Lstart–Lend`, `Lstart`, or `null` if no line fragment is present; returns `null` if the input is not a valid GitHub blob URL.
 */
function parseGithubCitation(url: string): GithubCitation | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (u.hostname !== 'github.com') return null
  const parts = u.pathname.split('/').filter(Boolean)
  if (parts.length < 5 || parts[2] !== 'blob') return null
  const [owner, name, , ref, ...rest] = parts
  if (!owner || !name || !ref || rest.length === 0) return null
  const m = u.hash.match(/^#L(\d+)(?:-L(\d+))?$/)
  return {
    repo: `${owner}/${name}`,
    ref,
    path: rest.join('/'),
    lineRange: m ? (m[2] ? `L${m[1]}–L${m[2]}` : `L${m[1]}`) : null,
  }
}

/**
 * Render a code block with an optional header and a copy-to-clipboard control.
 *
 * The header is shown only when not inside file tabs and when at least one of `data-source`, `data-filename`, or `data-language` is provided. When `data-source` is a GitHub blob URL it is parsed into `repo`, `ref`, `path`, and an optional `lineRange` for display. The copy button copies the rendered `<pre>` text to the clipboard, sets a temporary "Copied" visual state for 1400ms, and silently ignores clipboard failures.
 *
 * @param props - Props forwarded to the underlying `<pre>` including `children` and `className`. Special optional data props:
 *   - `data-filename` — filename to display in the header when no source citation is available.
 *   - `data-language` — language label displayed in the header.
 *   - `data-source` — GitHub blob URL to parse and display as a source citation (repo, ref, path, and optional line range).
 */
export function Pre(props: PreProps) {
  const insideTabs = useInsideFileTabs()
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const filename = props['data-filename']
  const language = props['data-language']
  const source = props['data-source']
  const citation = source ? parseGithubCitation(source) : null
  const showHeader = !insideTabs && (citation || filename || language)

  const copy = async (): Promise<void> => {
    const text = ref.current?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // clipboard blocked — silent
    }
  }

  const { className, children, ...rest } = props

  return (
    <figure className="my-8 not-prose group">
      {showHeader ? (
        <figcaption className="flex items-baseline justify-between gap-4 mb-1.5 text-[11px] font-mono leading-snug">
          <span className="min-w-0 truncate text-ink-muted">
            {citation ? (
              <a
                href={source}
                target="_blank"
                rel="noreferrer"
                className="no-underline hover:text-ink hover:no-underline transition-colors"
                title={source}
              >
                <span>{citation.repo}</span>
                <span className="text-ink-faint mx-1.5">·</span>
                <span title={citation.ref}>{citation.ref.slice(0, 7)}</span>
                <span className="text-ink-faint mx-1.5">·</span>
                <span>{citation.path}</span>
                {citation.lineRange ? (
                  <>
                    <span className="text-ink-faint mx-1.5">·</span>
                    <span>{citation.lineRange}</span>
                  </>
                ) : null}
              </a>
            ) : (
              <span>{filename ?? ''}</span>
            )}
          </span>
          {language ? (
            <span className="text-ink-faint uppercase tracking-[0.2em] shrink-0">
              {language}
            </span>
          ) : null}
        </figcaption>
      ) : null}
      <div className="relative">
        <pre ref={ref} className={className} {...rest}>
          {children}
        </pre>
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy code'}
          title={copied ? 'Copied' : 'Copy code'}
          onClick={copy}
          className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-sm text-ink-faint hover:text-ink bg-paper/80 hover:bg-paper border border-rule opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check aria-hidden className="size-3" />
          ) : (
            <Copy aria-hidden className="size-3" />
          )}
        </button>
      </div>
    </figure>
  )
}

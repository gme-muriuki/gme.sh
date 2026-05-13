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

import { useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { Check, Copy } from 'lucide-react'
import { useInsideFileTabs } from './internal'

type PreProps = ComponentPropsWithoutRef<'pre'> & {
  'data-language'?: string
  'data-filename'?: string
}

export function Pre(props: PreProps) {
  const insideTabs = useInsideFileTabs()
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const filename = props['data-filename']
  const language = props['data-language']
  const showHeader = !insideTabs && (filename || language)

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
  const preClassName = [
    className,
    showHeader ? '!rounded-t-none !border-t-0' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <figure className="my-6 not-prose group">
      {showHeader ? (
        <div className="flex items-baseline justify-between border border-rule border-b-0 rounded-t bg-paper-raised px-3.5 py-1.5 text-[11px] font-mono">
          <span className="text-ink-muted truncate">{filename ?? ''}</span>
          {language ? (
            <span className="text-ink-faint uppercase tracking-wide">
              {language}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="relative">
        <pre ref={ref} className={preClassName} {...rest}>
          {children}
        </pre>
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy code'}
          title={copied ? 'Copied' : 'Copy code'}
          onClick={copy}
          className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded text-ink-muted hover:text-ink bg-paper/80 hover:bg-paper border border-rule opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
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

import { Children, isValidElement, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { FileTabsContext } from './internal'

type Props = {
  children: ReactNode
}

type TabItem = {
  filename: string
  content: ReactElement
}

function extractFilename(el: ReactElement, fallback: string): string {
  const props = el.props as Record<string, unknown> | null
  const direct = props?.['data-filename']
  if (typeof direct === 'string') return direct
  return fallback
}

export function FileTabs({ children }: Props) {
  const items: TabItem[] = Children.toArray(children)
    .filter(isValidElement)
    .map((c, i) => ({
      filename: extractFilename(c as ReactElement, `untitled-${i + 1}`),
      content: c as ReactElement,
    }))
  const [active, setActive] = useState(0)
  const current = items[active]

  if (items.length === 0) return null

  return (
    <FileTabsContext.Provider value={true}>
      <figure className="my-6 not-prose">
        <div role="tablist" className="flex flex-wrap border border-rule border-b-0 rounded-t bg-paper-raised text-[11px] font-mono">
          {items.map((t, i) => {
            const isActive = i === active
            return (
              <button
                key={t.filename + i}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className={[
                  'px-3 py-1.5 border-r border-rule last:border-r-0 transition-colors',
                  isActive ? 'text-ink bg-paper' : 'text-ink-muted hover:text-ink',
                ].join(' ')}
              >
                {t.filename}
              </button>
            )
          })}
        </div>
        <div className="[&_figure]:!my-0 [&_pre]:!rounded-t-none [&_pre]:!border-t-0">
          {current?.content ?? null}
        </div>
      </figure>
    </FileTabsContext.Provider>
  )
}

import { useEffect, useState } from 'react'

type Item = { id: string; text: string; level: 2 | 3 }

export function TableOfContents() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const article = document.querySelector('.prose-essay')
    if (!article) return

    function scan() {
      if (!article) return
      const headings = article.querySelectorAll<HTMLElement>('h2[id], h3[id]')
      const list: Item[] = []
      headings.forEach((h) => {
        list.push({
          id: h.id,
          text: h.textContent ?? '',
          level: h.tagName === 'H2' ? 2 : 3,
        })
      })
      setItems(list)
    }

    scan()
    const observer = new MutationObserver(scan)
    observer.observe(article, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    return () => observer.disconnect()
  }, [])

  if (items.length === 0) return null

  return (
    <nav
      aria-label="Table of contents"
      className="mb-10 border-l-2 border-rule pl-4 not-prose"
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        contents
      </p>
      <ol className="space-y-1 text-sm">
        {items.map((it) => (
          <li key={it.id} className={it.level === 3 ? 'pl-4' : ''}>
            <a
              href={`#${it.id}`}
              className="no-underline text-ink-muted hover:text-ink hover:no-underline transition-colors"
            >
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

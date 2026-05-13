import { useEffect, useState } from 'react'

type Item = { id: string; text: string; level: 2 | 3 }

/**
 * Renders a table of contents from `h2[id]` and `h3[id]` elements inside the `.prose-essay` container.
 *
 * The list is synchronized with the document: it performs an initial scan and updates when the article's DOM changes.
 *
 * @returns A `<nav>` element with links to the detected headings, or `null` if no headings are found.
 */
export function TableOfContents() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const article = document.querySelector('.prose-essay')
    if (!article) return

    /**
     * Scan the article element for `h2[id]` and `h3[id]` headings and update the component's `items` state.
     *
     * Builds a list of items where each item contains the heading `id`, its visible `text`, and `level` (2 for `h2`, 3 for `h3`), then calls `setItems` with that list.
     *
     * If the article element is not found, the function returns without changing state.
     */
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

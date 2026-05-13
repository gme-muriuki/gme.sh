import { useEffect } from 'react'

type Args = {
  title?: string
  description?: string
}

const BASE_TITLE = 'wellformed'

/**
 * Update the document title and the page meta description when inputs change.
 *
 * @param title - Optional page title; when provided sets document.title to "`<title>` — wellformed", otherwise uses "wellformed"
 * @param description - Optional description; when defined sets the `content` of the `meta[name="description"]` element (creates the element if it does not exist)
 */
export function useDocumentMeta({ title, description }: Args): void {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE
    if (description !== undefined) {
      let meta = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      )
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }
  }, [title, description])
}

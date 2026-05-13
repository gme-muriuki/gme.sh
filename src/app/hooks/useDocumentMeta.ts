import { useEffect } from 'react'

type Args = {
  title?: string
  description?: string
}

const BASE_TITLE = 'wellformed'

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

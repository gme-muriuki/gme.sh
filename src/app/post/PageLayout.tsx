import type { PostEntry } from '@/app/content-index'
import { IndexHeader } from '@/app/chrome/IndexHeader'

type Props = { entry: PostEntry }

export function PageLayout({ entry }: Props) {
  const { Component, frontmatter: f } = entry
  return (
    <article>
      <IndexHeader
        kicker={f.title.toLowerCase()}
        title={f.title}
        dek={f.dek}
      />
      <div className="prose-essay">
        <Component />
      </div>
    </article>
  )
}

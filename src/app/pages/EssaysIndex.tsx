import { postsByType } from '@/app/content-index'
import { IndexHeader } from '@/app/chrome/IndexHeader'
import { PostRow } from '@/app/post/PostRow'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

export default function EssaysIndex() {
  useDocumentMeta({ title: 'Essays' })
  const essays = postsByType('essay')
  return (
    <article>
      <IndexHeader
        kicker="essays"
        title="Essays"
        dek="Long-form technical deep dives. Editorial gravity, the full reading-aid kit — sidenotes, diffs, file tabs, diagrams."
      />
      {essays.length === 0 ? (
        <p className="text-sm text-ink-faint italic">None yet.</p>
      ) : (
        <ul>
          {essays.map((e) => (
            <PostRow key={e.slug} entry={e} />
          ))}
        </ul>
      )}
    </article>
  )
}

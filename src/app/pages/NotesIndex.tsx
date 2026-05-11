import { postsByType } from '@/app/content-index'
import { IndexHeader } from '@/app/chrome/IndexHeader'
import { PostRow } from '@/app/post/PostRow'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

export default function NotesIndex() {
  useDocumentMeta({ title: 'Notes' })
  const notes = postsByType('note')
  return (
    <article>
      <IndexHeader
        kicker="notes"
        title="Notes"
        dek="Half-baked ideas, in-progress thinking. Each note carries a growth stage — seedling, growing, evergreen — and a last-tended date."
      />
      {notes.length === 0 ? (
        <p className="text-sm text-ink-faint italic">None yet.</p>
      ) : (
        <ul>
          {notes.map((n) => (
            <PostRow key={n.slug} entry={n} />
          ))}
        </ul>
      )}
    </article>
  )
}

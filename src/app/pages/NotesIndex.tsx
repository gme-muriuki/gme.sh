import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function NotesIndex() {
  return (
    <article>
      <IndexHeader
        kicker="notes"
        title="Notes"
        dek="Half-baked ideas, in-progress thinking. Each note carries a growth stage — seedling, growing, evergreen — and a last-tended date."
      />
      <p className="text-sm text-ink-faint">No notes yet.</p>
    </article>
  )
}

import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function Archive() {
  return (
    <article>
      <IndexHeader
        kicker="archive"
        title="Archive"
        dek="Chronological, grouped by year. Date · type · title · one-line description · tags."
      />
      <p className="text-sm text-ink-faint">No entries yet.</p>
    </article>
  )
}

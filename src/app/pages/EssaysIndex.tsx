import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function EssaysIndex() {
  return (
    <article>
      <IndexHeader
        kicker="essays"
        title="Essays"
        dek="Long-form technical deep dives. Editorial gravity, the full reading-aid kit — sidenotes, diffs, file tabs, diagrams."
      />
      <p className="text-sm text-ink-faint">No posts yet.</p>
    </article>
  )
}

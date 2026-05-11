import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function Reading() {
  return (
    <article>
      <IndexHeader
        kicker="reading"
        title="Reading"
        dek="Currently reading at top, recently finished below. Books, papers, links — with reactions, not Goodreads-list bloat."
      />
      <p className="text-sm text-ink-faint">Coming soon.</p>
    </article>
  )
}

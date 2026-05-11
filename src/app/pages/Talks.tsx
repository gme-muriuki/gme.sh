import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function Talks() {
  return (
    <article>
      <IndexHeader
        kicker="talks"
        title="Talks"
        dek="Conference talks and writing elsewhere. Date · venue · title · link."
      />
      <p className="text-sm text-ink-faint">Coming soon.</p>
    </article>
  )
}

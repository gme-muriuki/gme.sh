import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function Now() {
  return (
    <article>
      <IndexHeader
        kicker="now"
        title="Now"
        dek="What I'm working on this month. One screen. Dated. Past entries archived below."
      />
      <p className="text-sm text-ink-faint">Coming soon.</p>
    </article>
  )
}

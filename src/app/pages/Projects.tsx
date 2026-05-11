import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function Projects() {
  return (
    <article>
      <IndexHeader
        kicker="projects"
        title="Projects"
        dek="Standing portfolio list. Separate from the Shipped stream; cross-linked when a release exists."
      />
      <p className="text-sm text-ink-faint">Coming soon.</p>
    </article>
  )
}

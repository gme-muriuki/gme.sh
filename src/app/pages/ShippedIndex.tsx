import { IndexHeader } from '@/app/chrome/IndexHeader'

export default function ShippedIndex() {
  return (
    <article>
      <IndexHeader
        kicker="shipped"
        title="Shipped"
        dek="Product launches and project releases. Framed as releases — repo, docs, demo, changelog — not blog posts."
      />
      <p className="text-sm text-ink-faint">Nothing shipped yet.</p>
    </article>
  )
}

import { postsByType } from '@/app/content-index'
import { IndexHeader } from '@/app/chrome/IndexHeader'
import { PostRow } from '@/app/post/PostRow'
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta'

export default function ShippedIndex() {
  useDocumentMeta({ title: 'Shipped' })
  const shipped = postsByType('shipped')
  return (
    <article>
      <IndexHeader
        kicker="shipped"
        title="Shipped"
        dek="Product launches and project releases. Framed as releases — repo, docs, demo, changelog — not blog posts."
      />
      {shipped.length === 0 ? (
        <p className="text-sm text-ink-faint italic">Nothing shipped yet.</p>
      ) : (
        <ul>
          {shipped.map((s) => (
            <PostRow key={s.slug} entry={s} />
          ))}
        </ul>
      )}
    </article>
  )
}

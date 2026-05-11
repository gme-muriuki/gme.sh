import { publishedPosts } from '@/app/content-index'
import type { PostEntry } from '@/app/content-index'
import { IndexHeader } from '@/app/chrome/IndexHeader'
import { ArchiveRow } from '@/app/post/ArchiveRow'

export default function Archive() {
  const groups = new Map<string, PostEntry[]>()
  for (const p of publishedPosts) {
    if (p.type === 'page') continue
    const year = p.frontmatter.date.slice(0, 4)
    const arr = groups.get(year) ?? []
    arr.push(p)
    groups.set(year, arr)
  }
  const years = Array.from(groups.keys()).sort().reverse()

  return (
    <article>
      <IndexHeader
        kicker="archive"
        title="Archive"
        dek="Chronological, grouped by year. Date · type · title · description · tags."
      />
      {years.length === 0 ? (
        <p className="text-sm text-ink-faint italic">No entries yet.</p>
      ) : (
        <div className="space-y-14">
          {years.map((yr) => {
            const items = groups.get(yr) ?? []
            return (
              <section key={yr}>
                <h2 className="font-mono text-xl font-semibold tracking-tight text-ink-muted">
                  {yr}
                </h2>
                <ul className="mt-3 border-t border-rule/60">
                  {items.map((p) => (
                    <ArchiveRow key={`${p.type}-${p.slug}`} entry={p} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </article>
  )
}

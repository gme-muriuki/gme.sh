type Props = {
  tags?: string[]
}

export function Tags({ tags }: Props) {
  if (!tags || tags.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[11px] text-ink-muted">
      {tags.map((tag) => (
        <li key={tag}>
          <a
            href={`/tags/${encodeURIComponent(tag)}`}
            className="no-underline hover:text-ink hover:no-underline transition-colors"
          >
            #{tag}
          </a>
        </li>
      ))}
    </ul>
  )
}

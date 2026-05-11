export type Series = { name: string; index: number; total: number }

type Props = {
  series: Series
  className?: string
}

export function SeriesNav({ series, className }: Props) {
  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded border border-rule bg-paper-raised/55 px-3 py-1.5 font-mono text-[11px] text-ink-muted',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="text-ink">{series.name}</span>
      <span aria-hidden className="text-ink-faint">·</span>
      <span>
        part {series.index} of {series.total}
      </span>
    </div>
  )
}

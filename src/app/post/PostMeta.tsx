import { format } from 'date-fns'
import { SquareMark } from '@/app/chrome/SquareMark'

type Props = {
  type: 'essay' | 'note' | 'shipped'
  date: string
  readingTime?: number
  growth?: 'seedling' | 'growing' | 'evergreen'
  lastTended?: string
}

const labels = {
  essay: 'Essay',
  note: 'Note',
  shipped: 'Shipped',
} as const

export function PostMeta({ type, date, readingTime, growth, lastTended }: Props) {
  const parsed = new Date(date)
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
      <span>{labels[type]}</span>
      <SquareMark className="text-[7px]" />
      <span>{format(parsed, 'MMM yyyy')}</span>
      {typeof readingTime === 'number' ? (
        <>
          <SquareMark className="text-[7px]" />
          <span>{readingTime} min</span>
        </>
      ) : null}
      {growth ? (
        <>
          <SquareMark className="text-[7px]" />
          <span className="text-brand">{growth}</span>
        </>
      ) : null}
      {lastTended ? (
        <>
          <SquareMark className="text-[7px]" />
          <span>tended {format(new Date(lastTended), 'MMM yyyy')}</span>
        </>
      ) : null}
    </p>
  )
}

import { format } from 'date-fns'
import type {
  EssayFrontmatter,
  NoteFrontmatter,
  ShippedFrontmatter,
} from '*.mdx'
import { SquareMark } from '@/app/chrome/SquareMark'

type Props = {
  frontmatter: EssayFrontmatter | NoteFrontmatter | ShippedFrontmatter
}

const labels = {
  essay: 'Essay',
  note: 'Note',
  shipped: 'Shipped',
} as const

/**
 * Render a compact metadata row for a post showing its label, date, and any type-specific details.
 *
 * @param frontmatter - The post frontmatter (EssayFrontmatter | NoteFrontmatter | ShippedFrontmatter). Uses `type` and `date` for all posts; additionally renders `readingTime` for essays, and `growth` and `lastTended` for notes when present.
 * @returns A paragraph element containing the post label, formatted date, and optional segments for reading time, growth, or tended date.
 */
export function PostMeta({ frontmatter: f }: Props) {
  const parsed = new Date(f.date)
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
      <span>{labels[f.type]}</span>
      <SquareMark className="text-[7px]" />
      <span>{format(parsed, 'MMM yyyy')}</span>
      {f.type === 'essay' && typeof f.readingTime === 'number' ? (
        <>
          <SquareMark className="text-[7px]" />
          <span>{f.readingTime} min</span>
        </>
      ) : null}
      {f.type === 'note' && f.growth ? (
        <>
          <SquareMark className="text-[7px]" />
          <span className="text-brand">{f.growth}</span>
        </>
      ) : null}
      {f.type === 'note' && f.lastTended ? (
        <>
          <SquareMark className="text-[7px]" />
          <span>tended {format(new Date(f.lastTended), 'MMM yyyy')}</span>
        </>
      ) : null}
    </p>
  )
}

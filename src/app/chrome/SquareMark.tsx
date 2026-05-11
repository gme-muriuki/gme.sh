import { cn } from '@/app/lib/cn'

type Props = {
  className?: string
  decorative?: boolean
}

export function SquareMark({ className, decorative = true }: Props) {
  return (
    <span
      aria-hidden={decorative}
      className={cn('inline-block align-middle text-brand select-none', className)}
    >
      ■
    </span>
  )
}

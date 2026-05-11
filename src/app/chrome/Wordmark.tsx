import { Link } from 'react-router'

type Props = {
  size?: 'sm' | 'md'
}

export function Wordmark({ size = 'md' }: Props) {
  const text = size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <Link
      to="/"
      className={`wordmark ${text} no-underline hover:no-underline text-ink`}
      aria-label="James Muriuki — home"
    >
      <span>James </span>
      <span className="surname">Muriuki</span>
    </Link>
  )
}

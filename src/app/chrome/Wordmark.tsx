import { Link } from 'react-router'

type Props = {
  size?: 'sm' | 'md'
}

export function Wordmark({ size = 'md' }: Props) {
  const text = size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <Link
      to="/"
      className={`wordmark ${text} no-underline hover:no-underline text-ink whitespace-nowrap`}
      aria-label="wellformed — home"
    >
      <span>well</span>
      <span className="surname">formed</span>
    </Link>
  )
}

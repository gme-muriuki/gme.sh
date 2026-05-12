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
      aria-label="The Recursion of Learning — home"
    >
      <span>The </span>
      <span className="surname">Recursion</span>
      <span> of Learning</span>
    </Link>
  )
}

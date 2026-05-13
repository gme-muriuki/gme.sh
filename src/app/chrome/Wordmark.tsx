import { Link } from 'react-router'

type Props = {
  size?: 'sm' | 'md'
}

/**
 * Render the site wordmark as a clickable link to the home route.
 *
 * @param size - Visual size of the wordmark (`'sm' | 'md'`); `'sm'` produces `text-base`, `'md'` produces `text-lg`. Defaults to `'md'`.
 * @returns A `Link` to `/` with `aria-label` `"wellformed — home"` containing two spans: `"well"` and `"formed"` (the latter has the `surname` class); the element's className includes the chosen text size, `wordmark`, `no-underline`, `text-ink`, and `whitespace-nowrap`.
 */
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

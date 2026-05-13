import { Link } from 'react-router'

type Props = {
  size?: 'sm' | 'md'
}

/**
 * Render the site wordmark as a link to the home route.
 *
 * The `size` prop controls the visual text size: `'sm'` maps to `text-base` and `'md'` maps to `text-lg`.
 *
 * @param size - Visual size of the wordmark (`'sm' | 'md'`); defaults to `'md'`
 * @returns A `Link` to `/` with aria-label `"wellformed — home"` containing two spans ("well" and "formed") and a composed className including the chosen text size, `wordmark`, `no-underline`, `text-ink`, and `whitespace-nowrap`.
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

import { Link } from 'react-router'

export default function NotFound() {
  return (
    <article>
      <p className="text-sm text-ink-muted font-mono uppercase tracking-wider">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Not here.</h1>
      <p className="mt-4 text-ink-muted">
        That page does not exist (yet).{' '}
        <Link to="/" className="text-ink">
          Home
        </Link>
        .
      </p>
    </article>
  )
}

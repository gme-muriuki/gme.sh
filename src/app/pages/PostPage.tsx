import { useParams } from 'react-router'

type Props = {
  type: 'essay' | 'note' | 'shipped'
}

export default function PostPage({ type }: Props) {
  const { slug } = useParams<{ slug: string }>()
  return (
    <article>
      <header>
        <p className="text-sm text-ink-muted font-mono uppercase tracking-wider">
          {type}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {slug ?? 'unknown'}
        </h1>
      </header>
      <p className="mt-12 text-sm text-ink-muted">
        Real {type} rendering arrives in commit 9.
      </p>
    </article>
  )
}

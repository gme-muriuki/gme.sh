export default function NotesIndex() {
  return (
    <article>
      <header>
        <p className="text-sm text-ink-muted font-mono uppercase tracking-wider">
          notes
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Notes</h1>
        <p className="mt-3 max-w-prose text-ink-muted">
          Half-baked ideas, in-progress thinking. Each note carries a growth stage
          (seedling / growing / evergreen) and a last-tended date.
        </p>
      </header>
      <p className="mt-12 text-sm text-ink-muted">No notes yet.</p>
    </article>
  )
}

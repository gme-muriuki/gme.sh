type Props = {
  kicker: string
  title: string
  dek?: string
}

export function IndexHeader({ kicker, title, dek }: Props) {
  return (
    <header className="mb-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        {kicker}
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-tighter leading-[0.95] text-ink">
        {title}
      </h1>
      {dek ? (
        <p className="mt-5 max-w-[44ch] text-base text-ink leading-snug">{dek}</p>
      ) : null}
    </header>
  )
}

import { useEffect, useState } from 'react'

type Props = {
  children: string
}

const lightVars = {
  primaryColor: '#F2EDE0',
  primaryTextColor: '#1F1B16',
  lineColor: '#1F1B16',
  textColor: '#1F1B16',
  mainBkg: '#F2EDE0',
  background: '#FAF7F0',
  primaryBorderColor: '#A8541E',
}

const darkVars = {
  primaryColor: '#221E1A',
  primaryTextColor: '#E8E2D5',
  lineColor: '#E8E2D5',
  textColor: '#E8E2D5',
  mainBkg: '#221E1A',
  background: '#1A1714',
  primaryBorderColor: '#D97757',
}

export function Mermaid({ children }: Props) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const render = async (): Promise<void> => {
      try {
        const { default: mermaid } = await import('mermaid')
        const isDark = document.documentElement.classList.contains('dark')
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          fontFamily: 'Source Serif 4 Variable, serif',
          themeVariables: isDark ? darkVars : lightVars,
        })
        const id = 'mermaid-' + Math.random().toString(36).slice(2, 9)
        const { svg: out } = await mermaid.render(id, children.trim())
        if (!cancelled) {
          setSvg(out)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    }

    render()

    const obs = new MutationObserver(() => {
      void render()
    })
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      cancelled = true
      obs.disconnect()
    }
  }, [children])

  if (error) {
    return (
      <pre className="my-6 not-prose text-xs text-[var(--destructive)]">
        mermaid: {error}
      </pre>
    )
  }
  return (
    <figure
      className="my-8 not-prose flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

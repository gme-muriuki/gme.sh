import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { evaluate } from '@mdx-js/mdx'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { useMDXComponents } from '@mdx-js/react'
import { runtimePlugins } from '@/app/mdx/pipeline'

type EvalState = {
  Component: ComponentType | null
  error: string | null
  pending: boolean
}

export function useMdxEval(source: string): EvalState {
  const [state, setState] = useState<EvalState>({
    Component: null,
    error: null,
    pending: true,
  })
  const components = useMDXComponents()

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, pending: true }))

    const compile = async (): Promise<void> => {
      try {
        const mod = (await evaluate(source, {
          Fragment,
          // @mdx-js/mdx evaluate runtime expects jsx/jsxs runtime
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          jsx: jsx as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          jsxs: jsxs as any,
          useMDXComponents: () => components,
          ...runtimePlugins,
        })) as { default: ComponentType }

        if (!cancelled) {
          setState({ Component: mod.default, error: null, pending: false })
        }
      } catch (e) {
        if (!cancelled) {
          setState({
            Component: null,
            error: e instanceof Error ? e.message : String(e),
            pending: false,
          })
        }
      }
    }

    void compile()
    return () => {
      cancelled = true
    }
  }, [source, components])

  return state
}

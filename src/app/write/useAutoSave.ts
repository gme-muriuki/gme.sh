import { useCallback, useEffect, useRef, useState } from 'react'
import type { PostType } from '@/app/content-index'
import {
  createSnapshot,
  persistenceAvailable,
  saveSource,
} from './persistence'

export type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'unsaved' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: number }
  | { kind: 'error'; message: string }

type Target = { type: PostType; slug: string } | null

export type AutoSave = {
  status: SaveStatus
  /**
   * Cancel any pending debounce and save now. Pass the post-mutation
   * source explicitly — callers that just called setSource won't see the
   * new value via the hook's deps until the next render.
   */
  flush: (override: string) => Promise<void>
}

const DEBOUNCE_MS = 2_000

/**
 * Debounces and persists `source` for the given `target`, avoiding redundant writes and exposing save state and a flush method.
 *
 * @param target - The resource identifier (type and slug). When `null` or `undefined`, saving is disabled and the hook remains idle.
 * @param source - The current text content to be saved.
 * @returns An object with `status` describing the save lifecycle (`idle`, `unsaved`, `saving`, `saved`, or `error`) and `flush(override)` to cancel any pending debounce and immediately persist the provided content.
 */
export function useAutoSave(target: Target, source: string): AutoSave {
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' })
  const lastSavedRef = useRef<string>(source)
  const lastTargetRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqIdRef = useRef(0)
  const targetRef = useRef(target)
  targetRef.current = target

  const runSave = useCallback(async (captured: string) => {
    const t = targetRef.current
    if (!t || !persistenceAvailable) return
    if (captured === lastSavedRef.current) return
    const id = ++reqIdRef.current
    setStatus({ kind: 'saving' })
    const result = await saveSource(t.type, t.slug, captured)
    if (id !== reqIdRef.current) return
    if (result.ok) {
      lastSavedRef.current = captured
      setStatus({ kind: 'saved', at: Date.now() })
      // Fire-and-forget snapshot. A failed snapshot doesn't roll back
      // the save; the user gets their version-history miss silently.
      void createSnapshot(t.type, t.slug, captured)
    } else {
      setStatus({ kind: 'error', message: result.error })
    }
  }, [])

  const flush = useCallback(
    async (override: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      await runSave(override)
    },
    [runSave],
  )

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const key = target ? `${target.type}/${target.slug}` : ''
    if (key !== lastTargetRef.current) {
      lastTargetRef.current = key
      lastSavedRef.current = source
      reqIdRef.current++
      setStatus({ kind: 'idle' })
      return
    }

    if (!target) return
    if (!persistenceAvailable) return
    if (source === lastSavedRef.current) return

    setStatus({ kind: 'unsaved' })

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void runSave(source)
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [target, source, runSave])

  return { status, flush }
}

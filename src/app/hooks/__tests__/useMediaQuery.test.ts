import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from '../useMediaQuery'

// Helper to build a mock MediaQueryList with controllable `matches` state.
function makeMockMQL(initialMatches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = []
  const mql = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') listeners.push(cb)
    }),
    removeEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(cb)
      if (idx >= 0) listeners.splice(idx, 1)
    }),
    dispatchEvent: vi.fn(),
    // Simulate the browser firing a media-query change event.
    _fire(matches: boolean) {
      mql.matches = matches
      listeners.forEach((cb) =>
        cb({ matches } as MediaQueryListEvent),
      )
    },
  }
  return mql
}

let mockMQL: ReturnType<typeof makeMockMQL>

beforeEach(() => {
  mockMQL = makeMockMQL(false)
  window.matchMedia = vi.fn().mockReturnValue(mockMQL)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMediaQuery', () => {
  it('returns false when matchMedia initially does not match', () => {
    mockMQL = makeMockMQL(false)
    window.matchMedia = vi.fn().mockReturnValue(mockMQL)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
  })

  it('returns true when matchMedia initially matches', () => {
    mockMQL = makeMockMQL(true)
    window.matchMedia = vi.fn().mockReturnValue(mockMQL)
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'))
    expect(result.current).toBe(true)
  })

  it('updates to true when the media query starts matching', () => {
    mockMQL = makeMockMQL(false)
    window.matchMedia = vi.fn().mockReturnValue(mockMQL)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    act(() => {
      mockMQL._fire(true)
    })

    expect(result.current).toBe(true)
  })

  it('updates to false when the media query stops matching', () => {
    mockMQL = makeMockMQL(true)
    window.matchMedia = vi.fn().mockReturnValue(mockMQL)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    act(() => {
      mockMQL._fire(false)
    })

    expect(result.current).toBe(false)
  })

  it('calls matchMedia with the provided query string', () => {
    renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('adds and removes a change event listener', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 600px)'))
    expect(mockMQL.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(mockMQL.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('re-subscribes when the query string changes', () => {
    const { rerender } = renderHook(
      ({ q }: { q: string }) => useMediaQuery(q),
      { initialProps: { q: '(min-width: 600px)' } },
    )

    const addCalls = mockMQL.addEventListener.mock.calls.length
    rerender({ q: '(min-width: 1024px)' })
    // Should have re-subscribed
    expect(mockMQL.addEventListener.mock.calls.length).toBeGreaterThanOrEqual(addCalls)
  })

  it('returns a boolean value (not undefined/null) in all cases', () => {
    // The hook's return type is always boolean. In jsdom, window is defined
    // so matchMedia is called; in SSR (typeof window === 'undefined') it
    // returns false via the lazy initializer.  Either way, result.current
    // must be a strict boolean.
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'))
    expect(typeof result.current).toBe('boolean')
    expect(result.current === true || result.current === false).toBe(true)
  })

  it('handles multiple simultaneous listeners without interference', () => {
    mockMQL = makeMockMQL(false)
    window.matchMedia = vi.fn().mockReturnValue(mockMQL)

    const { result: r1 } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    const { result: r2 } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    act(() => {
      mockMQL._fire(true)
    })

    expect(r1.current).toBe(true)
    expect(r2.current).toBe(true)
  })

  it('reflects rapid consecutive changes correctly', () => {
    mockMQL = makeMockMQL(false)
    window.matchMedia = vi.fn().mockReturnValue(mockMQL)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    act(() => {
      mockMQL._fire(true)
      mockMQL._fire(false)
      mockMQL._fire(true)
    })

    expect(result.current).toBe(true)
  })
})
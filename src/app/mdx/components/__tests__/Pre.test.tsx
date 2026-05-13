import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pre } from '../Pre'
import { FileTabsContext } from '../internal'

// Stub clipboard API (not available in jsdom)
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  })
})

// ─── parseGithubCitation — exercised via the Pre component's figcaption ─────

describe('Pre — GitHub citation header (data-source)', () => {
  const validUrl =
    'https://github.com/owner/repo/blob/abc1234ef/src/lib/mod.rs#L5-L20'

  it('renders a figcaption when data-source is a valid GitHub blob URL', () => {
    render(<Pre data-source={validUrl}><code>fn main() {'{}'}</code></Pre>)
    expect(document.querySelector('figcaption')).not.toBeNull()
  })

  it('renders repo as owner/name', () => {
    render(<Pre data-source={validUrl}><code /></Pre>)
    expect(screen.getByText('owner/repo')).toBeInTheDocument()
  })

  it('truncates ref to 7 characters for display', () => {
    render(<Pre data-source={validUrl}><code /></Pre>)
    // abc1234ef → first 7 chars → "abc1234"
    expect(screen.getByText('abc1234')).toBeInTheDocument()
  })

  it('renders the file path portion', () => {
    render(<Pre data-source={validUrl}><code /></Pre>)
    expect(screen.getByText('src/lib/mod.rs')).toBeInTheDocument()
  })

  it('renders the line range as Lstart–Lend with em-dash', () => {
    render(<Pre data-source={validUrl}><code /></Pre>)
    expect(screen.getByText('L5–L20')).toBeInTheDocument()
  })

  it('renders single-line range as L<n> with no em-dash', () => {
    const url =
      'https://github.com/owner/repo/blob/main/src/main.rs#L42'
    render(<Pre data-source={url}><code /></Pre>)
    expect(screen.getByText('L42')).toBeInTheDocument()
  })

  it('renders no line range when no hash fragment is present', () => {
    const url =
      'https://github.com/owner/repo/blob/main/src/main.rs'
    render(<Pre data-source={url}><code /></Pre>)
    // L-prefixed line reference must not appear in document
    expect(screen.queryByText(/^L\d/)).toBeNull()
  })

  it('renders the anchor href pointing to the original source URL', () => {
    render(<Pre data-source={validUrl}><code /></Pre>)
    const link = document.querySelector('figcaption a') as HTMLAnchorElement
    expect(link).not.toBeNull()
    expect(link.href).toBe(validUrl)
  })

  it('falls back to filename display for a non-GitHub URL', () => {
    render(
      <Pre data-source="https://gitlab.com/owner/repo/blob/main/file.rs" data-filename="fallback.rs">
        <code />
      </Pre>,
    )
    // non-github source → citation is null → shows filename instead
    expect(screen.getByText('fallback.rs')).toBeInTheDocument()
    expect(screen.queryByText(/^owner/)).toBeNull()
  })

  it('renders no figcaption for an invalid URL string', () => {
    render(<Pre data-source="not-a-url"><code /></Pre>)
    // not-a-url triggers null citation and no filename/language
    expect(document.querySelector('figcaption')).toBeNull()
  })

  it('returns null for a GitHub URL missing the blob segment', () => {
    const url = 'https://github.com/owner/repo/tree/main/src'
    render(<Pre data-source={url}><code /></Pre>)
    expect(document.querySelector('figcaption')).toBeNull()
  })

  it('returns null when the path after blob has no file segments', () => {
    // /owner/repo/blob/main — parts.length < 5 after filtering
    const url = 'https://github.com/owner/repo/blob/main'
    render(<Pre data-source={url}><code /></Pre>)
    expect(document.querySelector('figcaption')).toBeNull()
  })
})

describe('Pre — filename and language header', () => {
  it('shows filename in figcaption when data-filename is provided', () => {
    render(<Pre data-filename="src/lib.rs"><code /></Pre>)
    expect(screen.getByText('src/lib.rs')).toBeInTheDocument()
  })

  it('shows language label when data-language is provided', () => {
    render(<Pre data-language="rust"><code /></Pre>)
    expect(screen.getByText('rust')).toBeInTheDocument()
  })

  it('shows both filename and language when both are provided', () => {
    render(<Pre data-filename="lib.rs" data-language="rust"><code /></Pre>)
    expect(screen.getByText('lib.rs')).toBeInTheDocument()
    expect(screen.getByText('rust')).toBeInTheDocument()
  })

  it('renders no figcaption when no header props are supplied', () => {
    render(<Pre><code>hello</code></Pre>)
    expect(document.querySelector('figcaption')).toBeNull()
  })
})

describe('Pre — inside FileTabs context', () => {
  it('suppresses the figcaption inside FileTabs context', () => {
    render(
      <FileTabsContext.Provider value={true}>
        <Pre data-filename="lib.rs" data-language="rust"><code /></Pre>
      </FileTabsContext.Provider>,
    )
    expect(document.querySelector('figcaption')).toBeNull()
  })

  it('still renders the pre element inside FileTabs context', () => {
    render(
      <FileTabsContext.Provider value={true}>
        <Pre data-filename="lib.rs"><code>fn main(){'{}'}</code></Pre>
      </FileTabsContext.Provider>,
    )
    expect(document.querySelector('pre')).not.toBeNull()
  })
})

describe('Pre — copy button', () => {
  it('renders a copy button with aria-label "Copy code"', () => {
    render(<Pre><code>const x = 1</code></Pre>)
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
  })

  it('changes aria-label to "Copied" after clicking copy', async () => {
    const user = userEvent.setup()
    render(<Pre><code>const x = 1</code></Pre>)
    const btn = screen.getByRole('button', { name: /copy code/i })
    await user.click(btn)
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
  })
})
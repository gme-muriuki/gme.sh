import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router'
import { publishedPosts } from '@/app/content-index'
import { permalink } from '@/app/lib/permalink'
import { SOURCES } from '@/app/write/sources'
import { useTheme } from '@/app/hooks/useTheme'

type PaletteContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
}

const PaletteContext = createContext<PaletteContextValue>({
  open: false,
  setOpen: () => {},
})

/**
 * Access the current command palette context.
 *
 * @returns The current palette context value containing `open` — `true` if the palette is visible, `false` otherwise — and `setOpen` — a function that sets the palette visibility.
 */
export function usePalette(): PaletteContextValue {
  return useContext(PaletteContext)
}

const typeLabels = {
  essay: 'essay',
  note: 'note',
  shipped: 'shipped',
  page: 'page',
} as const

const staticPages = [
  { title: 'Home', href: '/', kicker: 'page' },
  { title: 'Archive', href: '/archive', kicker: 'page' },
  { title: 'Essays', href: '/essays', kicker: 'index' },
  { title: 'Notes', href: '/notes', kicker: 'index' },
  { title: 'Shipped', href: '/shipped', kicker: 'index' },
  { title: 'About', href: '/about', kicker: 'page' },
  { title: 'Uses', href: '/uses', kicker: 'page' },
  { title: 'Now', href: '/now', kicker: 'page' },
  { title: 'Projects', href: '/projects', kicker: 'page' },
  { title: 'Talks', href: '/talks', kicker: 'page' },
  { title: 'Reading', href: '/reading', kicker: 'page' },
  { title: 'Write', href: '/write', kicker: 'page' },
]

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <PaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <Palette open={open} setOpen={setOpen} />
    </PaletteContext.Provider>
  )
}

/**
 * Render the global command palette UI for searching and navigating the site.
 *
 * Renders a controlled command palette containing a search input, an Actions group
 * (theme toggle and open editor), searchable Posts and Pages groups, and keyboard
 * shortcut hints. Selecting an item closes the palette and navigates to the item's href.
 *
 * @param open - Whether the palette is currently visible
 * @param setOpen - Function to update the palette visibility
 * @returns The React element for the command palette
 */
function Palette({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (v: boolean) => void
}) {
  const navigate = useNavigate()
  const { resolved, toggle } = useTheme()
  const postItems = useMemo(
    () =>
      publishedPosts
        .filter((p) => p.type !== 'page')
        .map((p) => {
          const body = SOURCES[`${p.type}/${p.slug}`] ?? ''
          return {
            key: `${p.type}-${p.slug}`,
            title: p.frontmatter.title,
            dek: p.frontmatter.dek ?? '',
            tags: (p.frontmatter.tags ?? []).join(' '),
            body: body.toLowerCase(),
            kicker: typeLabels[p.type],
            href: permalink(p.type, p.slug),
          }
        }),
    [],
  )

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      void navigate(href)
    },
    [setOpen, navigate],
  )

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--ink)]/30 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[14vh] z-50 w-[min(640px,92vw)] -translate-x-1/2 rounded border border-rule bg-paper shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Command
            label="Search the site"
            className="flex flex-col max-h-[68vh]"
          >
            <Command.Input
              placeholder="Search posts, pages, tags…"
              className="bg-transparent border-0 border-b border-rule px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-0"
            />
            <Command.List className="overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-sm text-ink-faint italic">
                Nothing matched.
              </Command.Empty>
              <Command.Group
                heading="Actions"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-ink-muted"
              >
                <Command.Item
                  value={`toggle theme ${resolved === 'dark' ? 'light' : 'dark'} mode color scheme`}
                  onSelect={() => {
                    toggle()
                    setOpen(false)
                  }}
                  className="flex items-baseline gap-3 rounded px-3 py-2 cursor-pointer aria-selected:bg-paper-raised"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint shrink-0 w-14">
                    action
                  </span>
                  <span className="flex-1 text-ink">
                    Switch to {resolved === 'dark' ? 'light' : 'dark'} mode
                  </span>
                </Command.Item>
                <Command.Item
                  value="open write editor /write new draft"
                  onSelect={() => go('/write')}
                  className="flex items-baseline gap-3 rounded px-3 py-2 cursor-pointer aria-selected:bg-paper-raised"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint shrink-0 w-14">
                    action
                  </span>
                  <span className="flex-1 text-ink">Open /write editor</span>
                </Command.Item>
              </Command.Group>
              {postItems.length > 0 ? (
                <Command.Group
                  heading="Posts"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-ink-muted"
                >
                  {postItems.map((it) => (
                    <Command.Item
                      key={it.key}
                      value={`${it.title} ${it.dek} ${it.tags} ${it.body}`}
                      onSelect={() => go(it.href)}
                      className="flex items-baseline gap-3 rounded px-3 py-2 cursor-pointer aria-selected:bg-paper-raised"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint shrink-0 w-14">
                        {it.kicker}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-ink">{it.title}</span>
                        {it.dek ? (
                          <span className="block text-xs text-ink-muted truncate">
                            {it.dek}
                          </span>
                        ) : null}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              <Command.Group
                heading="Pages"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-ink-muted"
              >
                {staticPages.map((p) => (
                  <Command.Item
                    key={p.href}
                    value={`${p.title} ${p.kicker}`}
                    onSelect={() => go(p.href)}
                    className="flex items-baseline gap-3 rounded px-3 py-2 cursor-pointer aria-selected:bg-paper-raised"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint shrink-0 w-14">
                      {p.kicker}
                    </span>
                    <span className="flex-1 text-ink">{p.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <div className="border-t border-rule px-3 py-1.5 font-mono text-[10px] text-ink-faint flex items-center justify-between">
              <span>↑↓ navigate · ↵ open · esc close</span>
              <span>⌘K</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

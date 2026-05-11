import { NavLink } from 'react-router'
import { cn } from '@/app/components/ui/utils'

const primary = [
  { to: '/essays', label: 'Essays' },
  { to: '/notes', label: 'Notes' },
  { to: '/shipped', label: 'Shipped' },
] as const

const secondary = [
  { to: '/projects', label: 'Projects' },
  { to: '/uses', label: 'Uses' },
  { to: '/now', label: 'Now' },
  { to: '/reading', label: 'Reading' },
  { to: '/talks', label: 'Talks' },
  { to: '/about', label: 'About' },
] as const

export function Nav() {
  return (
    <nav aria-label="Primary" className="min-w-0">
      <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {primary.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? 'nav-active text-sm font-medium'
                  : cn(
                      'no-underline text-sm font-medium text-ink',
                      'transition-opacity hover:opacity-75',
                    )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
        <li aria-hidden className="select-none text-ink-faint text-xs px-1">
          ·
        </li>
        {secondary.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? 'nav-active text-xs tracking-tight'
                  : cn(
                      'no-underline text-xs tracking-tight text-ink-muted',
                      'transition-colors hover:text-ink',
                    )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

import { NavLink } from 'react-router'
import { cn } from '@/app/components/ui/utils'

const items = [
  { to: '/essays', label: 'Essays' },
  { to: '/notes', label: 'Notes' },
  { to: '/shipped', label: 'Shipped' },
  { to: '/projects', label: 'Projects' },
  { to: '/uses', label: 'Uses' },
  { to: '/now', label: 'Now' },
  { to: '/reading', label: 'Reading' },
  { to: '/talks', label: 'Talks' },
  { to: '/about', label: 'About' },
] as const

export function Nav() {
  return (
    <nav aria-label="Primary">
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {items.map((item, i) => (
          <li key={item.to} className="flex items-center gap-x-3">
            {i > 0 ? (
              <span aria-hidden className="text-ink-muted/60 select-none">
                ·
              </span>
            ) : null}
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'no-underline hover:no-underline transition-colors',
                  isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
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

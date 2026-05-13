import { Outlet, ScrollRestoration } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-paper focus:border focus:border-rule focus:rounded focus:text-sm focus:no-underline"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <div className="chrome-frame editorial-grid py-14">
          <Outlet />
          <aside
            className="editorial-rail hidden lg:block"
            aria-hidden="true"
          />
        </div>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}

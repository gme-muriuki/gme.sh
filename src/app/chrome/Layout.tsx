import { Outlet, ScrollRestoration } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        <div className="chrome-frame editorial-grid py-14">
          <Outlet />
          <aside className="hidden lg:block" aria-hidden />
        </div>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}

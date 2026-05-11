import { Outlet, ScrollRestoration } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-6 py-12">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}

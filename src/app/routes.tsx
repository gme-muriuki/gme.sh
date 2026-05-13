import { createBrowserRouter, Outlet } from 'react-router'
import { Layout } from './chrome/Layout'
import { CommandPaletteProvider } from './chrome/CommandPalette'
import Home from './pages/Home'
import EssaysIndex from './pages/EssaysIndex'
import NotesIndex from './pages/NotesIndex'
import ShippedIndex from './pages/ShippedIndex'
import Archive from './pages/Archive'
import Write from './pages/Write'
import PostPage from './pages/PostPage'
import StaticPage from './pages/StaticPage'
import RssFeed from './pages/RssFeed'
import OgCard from './pages/OgCard'
import NotFound from './pages/NotFound'

/**
 * Provides command-palette context for nested routes and renders those routes.
 *
 * @returns A JSX element that wraps routed children with `CommandPaletteProvider`
 */
function PaletteShell() {
  return (
    <CommandPaletteProvider>
      <Outlet />
    </CommandPaletteProvider>
  )
}

export const router = createBrowserRouter([
  {
    // standalone — no chrome, no palette — for screenshotting
    path: '/og/:slug',
    element: <OgCard />,
  },
  {
    element: <PaletteShell />,
    children: [
      // /write is outside Layout: full-viewport IDE, no Header/Footer
      { path: '/write', element: <Write /> },
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'essays', element: <EssaysIndex /> },
          { path: 'essays/:slug', element: <PostPage type="essay" /> },
          { path: 'notes', element: <NotesIndex /> },
          { path: 'notes/:slug', element: <PostPage type="note" /> },
          { path: 'shipped', element: <ShippedIndex /> },
          { path: 'shipped/:slug', element: <PostPage type="shipped" /> },
          { path: 'archive', element: <Archive /> },
          { path: 'about', element: <StaticPage slug="about" /> },
          { path: 'uses', element: <StaticPage slug="uses" /> },
          { path: 'now', element: <StaticPage slug="now" /> },
          { path: 'projects', element: <StaticPage slug="projects" /> },
          { path: 'talks', element: <StaticPage slug="talks" /> },
          { path: 'reading', element: <StaticPage slug="reading" /> },
          { path: 'rss.xml', element: <RssFeed /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])

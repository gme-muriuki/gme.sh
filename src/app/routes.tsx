import { createBrowserRouter } from 'react-router'
import { Layout } from './chrome/Layout'
import Home from './pages/Home'
import EssaysIndex from './pages/EssaysIndex'
import NotesIndex from './pages/NotesIndex'
import ShippedIndex from './pages/ShippedIndex'
import Archive from './pages/Archive'
import Write from './pages/Write'
import PostPage from './pages/PostPage'
import StaticPage from './pages/StaticPage'
import NotFound from './pages/NotFound'

export const router = createBrowserRouter([
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
      { path: 'write', element: <Write /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

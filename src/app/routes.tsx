import { createBrowserRouter } from 'react-router'
import { Layout } from './chrome/Layout'
import Home from './pages/Home'
import EssaysIndex from './pages/EssaysIndex'
import NotesIndex from './pages/NotesIndex'
import ShippedIndex from './pages/ShippedIndex'
import Archive from './pages/Archive'
import About from './pages/About'
import Uses from './pages/Uses'
import Now from './pages/Now'
import Projects from './pages/Projects'
import Talks from './pages/Talks'
import Reading from './pages/Reading'
import Write from './pages/Write'
import PostPage from './pages/PostPage'
import NotFound from './pages/NotFound'
import MdxSmoke from './pages/MdxSmoke'

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
      { path: 'about', element: <About /> },
      { path: 'uses', element: <Uses /> },
      { path: 'now', element: <Now /> },
      { path: 'projects', element: <Projects /> },
      { path: 'talks', element: <Talks /> },
      { path: 'reading', element: <Reading /> },
      { path: 'write', element: <Write /> },
      { path: '_smoke', element: <MdxSmoke /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

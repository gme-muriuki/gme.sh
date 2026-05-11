import { RouterProvider } from 'react-router'
import { router } from './routes'
import { MDXRoot } from './mdx/provider'

export default function App() {
  return (
    <MDXRoot>
      <RouterProvider router={router} />
    </MDXRoot>
  )
}

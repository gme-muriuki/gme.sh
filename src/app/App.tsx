import { RouterProvider } from 'react-router'
import { router } from './routes'
import { MDXRoot } from './mdx/provider'
import { ThemeProvider } from './hooks/useTheme'

export default function App() {
  return (
    <ThemeProvider>
      <MDXRoot>
        <RouterProvider router={router} />
      </MDXRoot>
    </ThemeProvider>
  )
}

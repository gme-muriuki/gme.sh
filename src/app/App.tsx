import { RouterProvider } from 'react-router'
import { router } from './routes'
import { MDXRoot } from './mdx/provider'
import { CommandPaletteProvider } from './chrome/CommandPalette'

export default function App() {
  return (
    <MDXRoot>
      <CommandPaletteProvider>
        <RouterProvider router={router} />
      </CommandPaletteProvider>
    </MDXRoot>
  )
}

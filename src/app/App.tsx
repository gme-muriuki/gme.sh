import { RouterProvider } from 'react-router'
import { router } from './routes'
import { MDXRoot } from './mdx/provider'
import { CommandPaletteProvider } from './chrome/CommandPalette'
import { ThemeProvider } from './hooks/useTheme'

export default function App() {
  return (
    <ThemeProvider>
      <MDXRoot>
        <CommandPaletteProvider>
          <RouterProvider router={router} />
        </CommandPaletteProvider>
      </MDXRoot>
    </ThemeProvider>
  )
}

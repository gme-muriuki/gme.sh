import { defineConfig, type Plugin } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { buildTimePlugins } from './src/app/mdx/pipeline'
import {
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
} from './src/styles/theme-colors'

// Substitutes the theme-color placeholders in index.html with the values
// from src/styles/theme-colors.ts, so the no-flash inline script and
// useTheme.tsx share one source of truth.
function themeColorInject(): Plugin {
  return {
    name: 'theme-color-inject',
    transformIndexHtml(html) {
      return html
        .replace(/__THEME_LIGHT__/g, THEME_COLOR_LIGHT)
        .replace(/__THEME_DARK__/g, THEME_COLOR_DARK)
    },
  }
}

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        ...buildTimePlugins,
        providerImportSource: '@mdx-js/react',
      }),
    },
    themeColorInject(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

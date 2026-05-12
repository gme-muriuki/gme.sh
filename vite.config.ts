import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { buildTimePlugins } from './src/app/mdx/pipeline'

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        ...buildTimePlugins,
        providerImportSource: '@mdx-js/react',
      }),
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

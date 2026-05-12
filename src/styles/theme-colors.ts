/**
 * Single source for the colours used by the browser-chrome
 * `<meta name="theme-color">` tag and by the runtime `apply()` in
 * useTheme.tsx. Imported by both `vite.config.ts` (which injects the
 * values into the no-flash inline script in `index.html` via
 * transformIndexHtml) and by `useTheme.tsx` at runtime.
 *
 * Match the `--paper` and `--paper` (dark) tokens in `src/styles/theme.css`.
 */
export const THEME_COLOR_LIGHT = '#FAF7F0'
export const THEME_COLOR_DARK = '#1A1714'

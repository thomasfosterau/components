/**
 * The `./svelte` entry's browser suite: the Svelte compiler and a real
 * Chromium under Vitest browser mode, as in the Svelte packages
 * (packages/mapbox/vite.config.ts is the model). Its own config because the
 * core's suite in `vite.config.ts` runs under Node; `test:unit` runs both.
 *
 * The entry imports the core by the package's own name (tsconfig.svelte.json
 * says why); the suite resolves that name to the source, as `check` does,
 * rather than to a `dist/` that may not be built.
 */

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { playwright } from 'vite-plus/test/browser-playwright';
import { defineConfig } from 'vite-plus';

/** A preinstalled Chromium (an agent session's /opt/pw-browsers/chromium); unset, Playwright uses its own download. */
const chromium = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'];

export default defineConfig({
  plugins: [svelte()],

  resolve: {
    alias: [
      {
        find: /^@thomasfosterau\/components-import$/,
        replacement: fileURLToPath(new URL('src/index.ts', import.meta.url)),
      },
    ],
  },

  // Every runtime dependency the suite reaches, pre-bundled before the first
  // test file loads: left to discovery, Vite optimises one on first import and
  // reloads the page, failing every test in flight (the Svelte packages'
  // configs say the same).
  optimizeDeps: {
    include: [
      '@thomasfosterau/components > @lucide/svelte',
      '@thomasfosterau/effect-document',
      '@thomasfosterau/effect-document/csv',
      '@thomasfosterau/effect-document/ooxml',
      '@thomasfosterau/effect-document/schema',
      'effect',
      'svelte',
      'vitest-browser-svelte',
    ],
  },

  test: {
    name: 'import-svelte',
    include: ['tests/svelte/**/*.test.ts'],
    testTimeout: 30_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: chromium === undefined ? {} : { executablePath: chromium },
      }),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
});

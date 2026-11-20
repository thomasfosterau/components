/**
 * Vite config for `@thomasfosterau/components-mapbox`: the browser unit suite
 * (the Svelte compiler + a real Chromium under Vitest browser mode) and the
 * `svelte-package` build that produces `dist/`.
 *
 * Modelled on packages/components/vite.config.ts — same task names, same
 * cache fingerprint — with two differences that follow from this being the
 * SECOND package rather than the first:
 *
 * - `check` and `test:unit` take `{ task: 'build', from: 'dependencies' }`.
 *   This package imports `@thomasfosterau/components/canvas`, whose `exports`
 *   point at the sibling's BUILT `dist/`, so neither the type-check nor the
 *   browser suite can resolve it until that build has run. Same edge the
 *   owner's app repos put in front of every consumer of a `svelte-package`
 *   workspace package.
 * - There are no Storybook tasks. This package's stories are rendered by the
 *   ONE Storybook in packages/components, whose `stories` glob reaches across
 *   into `../../mapbox/src/stories` — two Storybook installs for one design
 *   system is two review surfaces that can disagree.
 */

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from 'vite-plus/test/browser-playwright';
import { defineConfig } from 'vite-plus';

/** A preinstalled Chromium (an agent session's /opt/pw-browsers/chromium); unset, Playwright uses its own download. */
const chromium = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'];

/**
 * Input fingerprint for this package's cached tasks: everything the task can
 * read, minus `node_modules`, plus the lockfile — so a dependency bump busts
 * the cache and a `touch` does not.
 */
const cacheInputs = [
  { auto: true },
  '!node_modules/**',
  { pattern: '!node_modules/**', base: 'workspace' as const },
  { pattern: 'pnpm-lock.yaml', base: 'workspace' as const },
];

export default defineConfig({
  run: {
    tasks: {
      // `svelte-kit sync` generates this package's ambient types. Both
      // `svelte-package` and `svelte-check` need it to have run.
      sync: { command: 'svelte-kit sync', cache: false },
      // The published artifact.
      build: {
        command: 'svelte-package',
        dependsOn: ['sync'],
        cache: {
          output: ['dist/**'],
        },
      },
      // Type-checks `src/` (stories included) and `tests/`.
      check: {
        command: 'svelte-check --tsconfig ./tsconfig.json',
        dependsOn: [
          { task: 'check', from: 'dependencies' },
          { task: 'build', from: 'dependencies' },
          'sync',
        ],
        cache: {
          input: cacheInputs,
          output: [],
        },
      },
      // Playwright reads `PLAYWRIGHT_BROWSERS_PATH` from the environment; the
      // root's `browser:install` installs the Chromium it expects.
      'test:unit': {
        command: 'vp test run tests',
        dependsOn: [
          'sync',
          { task: 'build', from: 'dependencies' },
          '@thomasfosterau/monorepo#browser:install',
        ],
        cache: {
          env: [
            'VITEST_MAX_WORKERS',
            'NODE_OPTIONS',
            'PLAYWRIGHT_BROWSERS_PATH',
            'PLAYWRIGHT_CHROMIUM_EXECUTABLE',
          ],
          input: cacheInputs,
          output: [],
        },
      },
    },
  },

  plugins: [svelte()],

  // Pre-bundle every dependency the browser suite reaches, `mapbox-gl` included
  // (`DynamicMap` imports it late): one Vite discovers mid-run reloads the page.
  optimizeDeps: {
    include: [
      '@testing-library/jest-dom/vitest',
      'clsx',
      'mapbox-gl',
      'svelte',
      'vitest-browser-svelte',
    ],
  },

  test: {
    include: ['tests/**/*.test.ts'],
    // Registers the jest-dom matchers.
    setupFiles: ['./tests/setup.ts'],
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

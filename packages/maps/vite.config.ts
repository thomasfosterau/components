/**
 * Vite config for `@thomasfosterau/components-maps`: the browser unit suite
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
 *   into `../../maps/src/stories` — two Storybook installs for one design
 *   system is two review surfaces that can disagree.
 */

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite-plus';

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
      // Browser mode, so `test:unit` never needs `PLAYWRIGHT_BROWSERS_PATH`
      // spelled out here: Playwright reads it from the environment.
      'test:unit': {
        command: 'vp test run tests',
        dependsOn: ['sync', { task: 'build', from: 'dependencies' }],
        cache: {
          env: ['VITEST_MAX_WORKERS', 'NODE_OPTIONS', 'PLAYWRIGHT_BROWSERS_PATH'],
          input: cacheInputs,
          output: [],
        },
      },
    },
  },

  plugins: [svelte()],

  // Every runtime dependency the browser suite reaches, pre-bundled BEFORE the
  // first test file loads — left to discovery, Vite optimises them on first
  // import and reloads the page, failing every test in flight at that moment.
  // `mapbox-gl` is on the list because `DynamicMap` reaches it from a dynamic
  // `import()` inside a mount effect, which is exactly the late discovery that
  // triggers the reload.
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
    // A REAL browser, not a DOM shim — the same reason as the sibling's suite:
    // focus order, keyboard handling and the accessibility tree are the
    // contract, and no shim models them faithfully enough to be evidence.
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
});

/**
 * Vite config for the published library: the component unit suite (the Svelte
 * compiler + a real Chromium under Vitest browser mode), the `svelte-package`
 * build that produces `dist/`, and the Storybook tasks.
 */

import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
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
      // The published artifact; consumers resolve `exports` to `dist/`.
      build: {
        command: 'svelte-package',
        dependsOn: ['sync'],
        cache: {
          output: ['dist/**'],
        },
      },
      // `src/` (stories included), `tests/` and `.storybook/`.
      check: {
        command: 'svelte-check --tsconfig ./tsconfig.json',
        dependsOn: [{ task: 'check', from: 'dependencies' }, 'sync'],
        cache: {
          input: cacheInputs,
          output: [],
        },
      },
      // Playwright reads `PLAYWRIGHT_BROWSERS_PATH` from the environment; the
      // root's `browser:install` installs the Chromium it expects.
      'test:unit': {
        command: 'vp test run tests',
        dependsOn: ['sync', '@thomasfosterau/monorepo#browser:install'],
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
      // Outside the `check` graph. Both need `build` (the mapbox stories import
      // `/canvas` from this package's `dist/`), mapbox's `sync`, and
      // packages/import's `build` (its UI imports its core from `dist/`).
      storybook: {
        command: 'storybook dev -p 6006 --no-open',
        dependsOn: [
          'sync',
          'build',
          '@thomasfosterau/components-mapbox#sync',
          '@thomasfosterau/components-import#build',
        ],
        cache: false,
      },
      'storybook:build': {
        command: 'storybook build',
        dependsOn: [
          'sync',
          'build',
          '@thomasfosterau/components-mapbox#sync',
          '@thomasfosterau/components-import#build',
        ],
        cache: {
          output: ['storybook-static/**'],
        },
      },
    },
  },

  // `tailwindcss()` is here for Storybook only (`.storybook/preview.css`
  // imports the Tailwind + daisyUI stack a consumer runs); the unit suite and
  // `svelte-package` never emit CSS through it.
  plugins: [svelte(), tailwindcss()],

  // Pre-bundle every dependency the browser suite reaches (all of
  // `dependencies`, `peerDependencies` and test-only imports): one Vite
  // discovers mid-run makes it reload the page and fail the tests in flight.
  optimizeDeps: {
    include: [
      '@internationalized/date',
      '@lucide/svelte',
      '@testing-library/jest-dom/vitest',
      '@thomasfosterau/effect-forms-svelte',
      'effect/Schema',
      'bits-ui',
      'clsx',
      'svelte',
      'vitest-browser-svelte',
    ],
  },

  // Two projects. `browser` is the suite (every `*.test.ts`); `ssr` runs the
  // `*.ssr.test.ts` files under Node. Browser mode compiles `.svelte` files
  // for the client, so `svelte/server`'s `render` cannot mount them there
  // (it fails inside `assign_nodes`); under Node the Svelte plugin compiles
  // them for the server, which is what a render-to-string test needs.
  test: {
    testTimeout: 30_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/**/*.ssr.test.ts', '**/node_modules/**'],
          // Registers the jest-dom matchers.
          setupFiles: ['./tests/setup.ts'],
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
      },
      {
        extends: true,
        test: {
          name: 'ssr',
          include: ['tests/**/*.ssr.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});

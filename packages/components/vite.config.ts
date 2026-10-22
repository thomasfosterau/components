/**
 * Vite config for the published library: the component unit suite (the Svelte
 * compiler + a real Chromium under Vitest browser mode), the `svelte-package`
 * build that produces `dist/`, and the Storybook tasks.
 */

import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from 'vite-plus/test/browser-playwright';
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
      // The published artifact. `exports` points at `dist`, so every consumer's
      // type-check needs this to have run — they declare it topologically via
      // `{ task: "build", from: "dependencies" }`.
      build: {
        command: 'svelte-package',
        dependsOn: ['sync'],
        cache: {
          output: ['dist/**'],
        },
      },
      // Type-checks `src/` (stories included — they live under `src/stories/`,
      // outside the `src/lib/` tree `svelte-package` ships, and the tsconfig
      // `include` reaches `.storybook/` too) and `tests/`.
      check: {
        command: 'svelte-check --tsconfig ./tsconfig.json',
        dependsOn: [{ task: 'check', from: 'dependencies' }, 'sync'],
        cache: {
          input: cacheInputs,
          output: [],
        },
      },
      // Browser mode, so `test:unit` never needs `PLAYWRIGHT_BROWSERS_PATH`
      // spelled out here: Playwright reads it from the environment (the agent
      // image and the devcontainer both set it; CI installs the browser in a
      // step of its own).
      'test:unit': {
        command: 'vp test run tests',
        dependsOn: ['sync'],
        cache: {
          env: ['VITEST_MAX_WORKERS', 'NODE_OPTIONS', 'PLAYWRIGHT_BROWSERS_PATH'],
          input: cacheInputs,
          output: [],
        },
      },
      // Storybook — a human-facing dev loop and a static build, deliberately
      // OUTSIDE the `check` graph: the stories are type-checked by `check`
      // above (they are `src/` files), and rendering them is a review
      // affordance, not a gate. `--no-open` because agent sessions have no
      // browser to hand the URL to.
      // `build` is a dependency of both, not just `sync`: the `stories` glob
      // reaches into the sibling packages/maps, whose components import
      // `@thomasfosterau/components/canvas` — this package's own built `dist/`.
      // The sibling's `sync` too: its stories are compiled here, and its
      // tsconfig extends the `$app/tsconfig` that its own `sync` writes (#55).
      storybook: {
        command: 'storybook dev -p 6006 --no-open',
        dependsOn: ['sync', 'build', '@thomasfosterau/components-mapbox#sync'],
        cache: false,
      },
      'storybook:build': {
        command: 'storybook build',
        dependsOn: ['sync', 'build', '@thomasfosterau/components-mapbox#sync'],
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

  // Every runtime dependency the browser suite reaches, pre-bundled BEFORE the
  // first test file loads. Left to discovery, Vite optimises `bits-ui` (and
  // the rest) the first time a test imports it, then reloads the page — and
  // every test file in flight at that moment fails with "Failed to fetch
  // dynamically imported module" while the ones already running lose their
  // DOM mid-click. A warm local cache hides it; a fresh CI runner does not.
  // Vitest's own warning for that reload names this field as the fix.
  optimizeDeps: {
    include: [
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

  test: {
    include: ['tests/**/*.test.ts'],
    // Registers the jest-dom matchers.
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30_000,
    // A REAL browser, not a DOM shim. This library's contract is focus order,
    // keyboard handling and the accessibility tree — none of which a shim
    // models faithfully — so the suite drives Chromium through Playwright.
    // Headless everywhere: CI has no display, and neither does an agent
    // session.
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
});

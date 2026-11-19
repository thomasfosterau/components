/**
 * Vite config for `@thomasfosterau/components-import`: the Node unit suite
 * and the `vp pack` (tsdown) + `svelte-package` build that produces `dist/`.
 * The `./svelte` entry's browser suite has its own config,
 * `vite.svelte.config.ts`, since one Vitest config is either Node or browser
 * mode.
 *
 * The same task names and cache fingerprint as the other packages, so the
 * root `check` and the `-r` gates reach it unchanged. It follows
 * packages/charts' plain-TypeScript shape (AGENTS.md § Where it differs):
 *
 * - `build` is `vp pack` first: one `.mjs` + `.d.mts` for the `.` entry
 *   (it empties `dist/`, so it runs first). `svelte-package` then copies
 *   `src/svelte` into `dist/svelte` as `.svelte` source for the consumer's
 *   compiler, as packages/charts does for its `/svelte`.
 * - `check` is `tsc`, twice: once over the core and its suite, once over the
 *   core with no DOM or Node types (tsconfig.pure.json). `tsc` is the native
 *   TypeScript 7 binary (`@typescript/native`), Effect-patched by the root
 *   `prepare`. Then `svelte-check` over the Svelte entry, its stories and its
 *   suite (tsconfig.svelte.json), which `tsc` cannot read.
 * - `test:unit` runs the core's suite under Node (decoding and mapping, no
 *   DOM to drive), then the Svelte entry's in Chromium under Vitest browser
 *   mode, as the Svelte packages' suites run: focus, live regions and the
 *   accessibility tree are the contract there.
 * - `check`, `build` and `test:unit` take `{ task: 'build', from:
 *   'dependencies' }`: the UI imports `@thomasfosterau/components`, whose
 *   `exports` point at its built `dist/`, as packages/mapbox's do.
 */

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
      build: {
        command:
          'vp pack && svelte-package -i src/svelte -o dist/svelte --tsconfig tsconfig.svelte.json',
        dependsOn: [{ task: 'build', from: 'dependencies' }],
        cache: {
          output: ['dist/**'],
        },
      },
      check: {
        command:
          'tsc -p tsconfig.json && tsc -p tsconfig.pure.json && svelte-check --tsconfig ./tsconfig.svelte.json',
        dependsOn: [{ task: 'build', from: 'dependencies' }],
        cache: {
          input: cacheInputs,
          output: [],
        },
      },
      'test:unit': {
        command: 'vp test run tests && vp test run --config vite.svelte.config.ts',
        dependsOn: [{ task: 'build', from: 'dependencies' }],
        cache: {
          env: ['VITEST_MAX_WORKERS', 'NODE_OPTIONS', 'PLAYWRIGHT_BROWSERS_PATH'],
          input: cacheInputs,
          output: [],
        },
      },
    },
  },

  // The one public entry; the key is the `dist/` file name the package.json
  // `exports` map points at.
  pack: {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
  },

  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/svelte/**'],
  },
});

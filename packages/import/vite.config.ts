/**
 * Vite config for `@thomasfosterau/components-import`: the Node unit suite
 * and the `vp pack` (tsdown) build that produces `dist/`.
 *
 * The same task names and cache fingerprint as the other packages, so the
 * root `check` and the `-r` gates reach it unchanged. It follows
 * packages/charts' plain-TypeScript shape (AGENTS.md § Where it differs):
 *
 * - `build` is `vp pack`: one `.mjs` + `.d.mts` for the one entry. The
 *   `./svelte` entry (slice 3 of #139) will add `svelte-package` after it.
 * - `check` is `tsc`, twice: once over everything, once over `src` with no
 *   DOM or Node types (tsconfig.pure.json). `tsc` is the native TypeScript 7
 *   binary (`@typescript/native`), Effect-patched by the root `prepare`.
 * - `test:unit` runs under Node, not browser mode: the suites are decoding
 *   and mapping, with no DOM to drive.
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
        command: 'vp pack',
        cache: {
          output: ['dist/**'],
        },
      },
      check: {
        command: 'tsc -p tsconfig.json && tsc -p tsconfig.pure.json',
        cache: {
          input: cacheInputs,
          output: [],
        },
      },
      'test:unit': {
        command: 'vp test run tests',
        cache: {
          env: ['VITEST_MAX_WORKERS', 'NODE_OPTIONS'],
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
  },
});

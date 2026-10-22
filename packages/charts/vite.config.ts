/**
 * Vite config for `@thomasfosterau/charts`: the Node unit suite and the
 * `vp pack` (tsdown) build that produces `dist/`.
 *
 * Same task names and cache fingerprint as the two Svelte packages, so the
 * root `check` and the `-r` gates reach it unchanged, with three differences
 * that follow from this package containing no Svelte:
 *
 * - `build` is `vp pack`, not `svelte-package`, and there is no `sync`: the
 *   package is plain TypeScript (and TSX for the React entry), bundled into
 *   one `.mjs` + `.d.mts` per entry with shared chunks between them.
 * - `check` is `tsc`, twice: once over everything, once over `spec` and
 *   `core` with no DOM or Node types (tsconfig.pure.json), which is what
 *   keeps Layers 1 and 2 portable. `tsc` is the native TypeScript 7 binary
 *   (`@typescript/native`), Effect-patched by the root `prepare`.
 * - `test:unit` runs under Node, not browser mode. The suites are geometry,
 *   parsing and SSR string output; the few that mount into a DOM opt into
 *   `happy-dom` per file. See CLAUDE.md § Testing.
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
      // The published artifact, then the Effect isolation invariant checked
      // against what actually ships (scripts/check-dist-types.ts).
      build: {
        command: 'vp pack && node scripts/check-dist-types.ts',
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
      // Rewrites schema/chart-spec.v1.json from the Effect Schema source.
      // `tests/spec/json-schema.test.ts` fails until it has been run and the
      // result committed.
      'emit-schema': {
        command: 'node scripts/emit-json-schema.ts',
        cache: false,
      },
    },
  },

  // One bundle per public entry; the keys are the `dist/` file names the
  // package.json `exports` map points at.
  pack: {
    entry: {
      index: 'src/spec/index.ts',
      core: 'src/core/index.ts',
      prosemirror: 'src/prosemirror/index.ts',
      react: 'src/react/index.ts',
      vega: 'src/vega/index.ts',
      vue: 'src/vue/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
  },

  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});

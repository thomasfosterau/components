/**
 * `@thomasfosterau/charts`: `vp pack`, then `svelte-package` for `src/svelte`
 * (in that order: `vp pack` empties `dist/`); `tsc` and svelte-check; a Node suite.
 */

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
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
        command:
          'vp pack && svelte-package -i src/svelte -o dist/svelte --tsconfig tsconfig.svelte.json && node scripts/check-dist-types.ts',
        cache: {
          output: ['dist/**'],
        },
      },
      check: {
        command:
          'tsc -p tsconfig.json && tsc -p tsconfig.pure.json && svelte-check --tsconfig ./tsconfig.svelte.json',
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
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    entry: {
      index: 'src/spec/index.ts',
      core: 'src/core/index.ts',
      prosemirror: 'src/prosemirror/index.ts',
      vega: 'src/vega/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
  },

  // Compiles the `/svelte` entry for its suite. The suite renders through
  // `svelte/server`, so the plugin's default (server) resolution is the one
  // the tests want.
  plugins: [svelte()],

  // The `/svelte` entry imports the spec and core by the package's own name
  // (tsconfig.svelte.json says why); the suite resolves those names to the
  // sources, as `check` does, rather than to a `dist/` that may not be built.
  resolve: {
    alias: [
      {
        find: /^@thomasfosterau\/charts$/,
        replacement: fileURLToPath(new URL('src/spec/index.ts', import.meta.url)),
      },
      {
        find: /^@thomasfosterau\/charts\/core$/,
        replacement: fileURLToPath(new URL('src/core/index.ts', import.meta.url)),
      },
    ],
  },

  test: {
    include: ['tests/**/*.test.ts'],
  },
});

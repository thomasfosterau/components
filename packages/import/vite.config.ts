/**
 * `@thomasfosterau/components-import`: `vp pack` then `svelte-package` for
 * `./svelte`; `tsc` twice plus `svelte-check`; the core's suite under Node.
 * The `./svelte` browser suite has its own config, `vite.svelte.config.ts`.
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

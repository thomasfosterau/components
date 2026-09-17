import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  // The component package is a SvelteKit app; here we only need enough of the
  // Svelte plugin to compile `.svelte` files for the workspace test run.
  plugins: [svelte({ configFile: false })],

  // `melt` ships `.svelte.js` rune modules that it imports as `.svelte`, so it
  // has to go through the Svelte plugin rather than be externalised.
  ssr: {
    noExternal: ['melt'],
  },

  // Vitest — discovers tests across all workspace packages. Components are
  // exercised through `render` from `svelte/server`, so the suite runs in the
  // server environment. Testing client-side interaction would mean Vitest
  // browser mode, which is what Svelte itself recommends over a DOM shim.
  test: {
    include: ['packages/*/test/**/*.test.ts'],
    environment: 'node',
  },

  // Oxlint — type-aware linting + type checking (vp check).
  //
  // `packages/components` is a SvelteKit package: its types come from the
  // generated `$app/tsconfig` and its `.svelte` files are outside oxlint's
  // remit, so it is type checked by `svelte-check` instead (see the workspace
  // `check` script).
  lint: {
    ignorePatterns: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.svelte-kit/**',
      // Covered by `svelte-check`, and its tsconfig depends on files that only
      // exist after `svelte-kit sync`.
      'packages/components/src/**',
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },

  // Oxfmt — formatter of record for the workspace. `.svelte` files are outside
  // its remit and are kept in the same style by hand.
  fmt: {
    ignorePatterns: ['**/dist/**', '**/.svelte-kit/**'],
    singleQuote: true,
    semi: true,
  },
});

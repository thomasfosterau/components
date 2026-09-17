import { defineConfig } from 'vite-plus';

const srcOf = (pkg: string) => new URL(`./packages/${pkg}/src/index.ts`, import.meta.url).pathname;

export default defineConfig({
  resolve: {
    alias: {
      // Resolve workspace packages to source during dev/test so tests never
      // depend on built dist output. Published packages point at dist.
      '@thomasfosterau/chart-spec': srcOf('chart-spec'),
      '@thomasfosterau/chart-core': srcOf('chart-core'),
    },
  },

  // Vitest — discovers tests across all workspace packages.
  test: {
    include: ['packages/*/test/**/*.test.ts', 'packages/*/test/**/*.test.tsx'],
  },

  // Oxlint — type-aware linting + type checking (vp check).
  //
  // packages/components is a SvelteKit package: its types come from the
  // generated .svelte-kit/tsconfig.json and its .svelte files are outside
  // oxlint's remit, so it is checked by `svelte-check` instead (see the
  // workspace `check` script).
  lint: {
    ignorePatterns: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.svelte-kit/**',
      'packages/components/**',
      'schema/**',
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },

  // Oxfmt — formatter of record for the workspace.
  fmt: {
    // schema/ holds generated JSON Schema artifacts; their formatting is
    // owned by the emit script, not the formatter.
    ignorePatterns: ['**/dist/**', '**/.svelte-kit/**', 'schema/**'],
    singleQuote: true,
    semi: true,
  },
});

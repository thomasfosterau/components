import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve workspace packages to source during dev/test so tests never
      // depend on built dist output. Published packages point at dist.
      '@thomasfosterau/chart-spec': new URL('./packages/chart-spec/src/index.ts', import.meta.url)
        .pathname,
      '@thomasfosterau/chart-core': new URL('./packages/chart-core/src/index.ts', import.meta.url)
        .pathname,
    },
  },

  // Vitest — discovers tests across all workspace packages.
  test: {
    include: ['packages/*/test/**/*.test.ts'],
  },

  // Oxlint — type-aware linting + type checking (vp check).
  lint: {
    ignorePatterns: ['**/dist/**', '**/node_modules/**', 'schema/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },

  // Oxfmt — formatter of record for the workspace.
  fmt: {
    // schema/ holds generated JSON Schema artifacts; their formatting is
    // owned by the emit script, not the formatter.
    ignorePatterns: ['**/dist/**', 'schema/**'],
    singleQuote: true,
    semi: true,
  },
});

/**
 * Root workspace config. Owns the repo-wide format/lint/staged passes (read
 * statically by `vp fmt` / `vp lint` / `vp staged`) and the one aggregate
 * task — `check`, the type-check gate over every package.
 *
 * The Svelte plugin, the browser test suite, the `svelte-package` build and
 * the Storybook tasks all live in packages/components/vite.config.ts: this
 * file deliberately compiles nothing, so adding a second package never means
 * editing it.
 */

import { defineConfig } from 'vite-plus';

export default defineConfig({
  // Staged-file checks run by `vp staged` (pre-commit). Routed by type: oxfmt
  // cannot format `.svelte`, so Svelte goes through lint alone while the
  // oxfmt-supported types get the full format+lint+fix pass.
  staged: {
    '*.{js,ts,css,json,md}': 'vp check --fix',
    '*.svelte': 'vp lint --fix',
  },

  run: {
    tasks: {
      // The type-check gate, as one task: every package's `check` pipeline
      // (`svelte-kit sync` + svelte-check). A pure graph node — the root
      // takes `@thomasfosterau/components` as a dependency purely so this
      // edge reaches it.
      check: {
        command: "echo 'check: all type gates green'",
        dependsOn: [{ from: 'dependencies', task: 'check' }],
        cache: false,
      },
    },
  },

  // Oxlint. Type-aware linting is intentionally OFF: the package's types come
  // from the `svelte-kit sync` output and its `.svelte` files are outside
  // oxlint's remit either way, so type checking stays svelte-check's job via
  // `vp run check`.
  lint: {
    ignorePatterns: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.svelte-kit/**',
      '**/storybook-static/**',
      '**/coverage/**',
    ],
    options: {
      typeAware: false,
      typeCheck: false,
    },
  },

  // Oxfmt — formatter of record for the workspace. `.svelte` files are outside
  // its remit and are kept in the same style by hand. `sortTailwindcss` is on
  // because this is a Tailwind library: class order is a diff-noise source
  // otherwise, and a literal lookup table (see AGENTS.md) is exactly the shape
  // it can sort.
  fmt: {
    ignorePatterns: ['**/dist/**', '**/.svelte-kit/**', '**/storybook-static/**'],
    singleQuote: true,
    semi: true,
    sortTailwindcss: {},
    overrides: [
      {
        files: ['**/*.md'],
        options: {
          proseWrap: 'never',
        },
      },
    ],
  },
});

/**
 * Root workspace config. Owns the repo-wide format/lint/staged passes (read
 * statically by `vp fmt` / `vp lint` / `vp staged`) and the one aggregate
 * task — `check`, the type-check gate over every package.
 *
 * The Svelte plugin, the browser test suite and the `svelte-package` build
 * live in each package's `vite.config.ts` (Storybook in packages/components
 * only): this file deliberately compiles nothing, so adding a package never
 * means editing it.
 */

import { recommended as effectTsgoRecommended } from '@effect/tsgo/oxlint-presets';
import effect from '@mpsuesser/oxlint-plugin-effect';
import { defineConfig } from 'vite-plus';

/**
 * The files that import Effect, and the only ones the Effect lint presets
 * apply to (AGENTS.md § Effect). Everywhere else in this workspace Effect is
 * out of bounds — `.fallowrc.json`'s boundaries keep it that way — so the
 * presets' idioms (Option over `null`, `Arr.match` over `.length`, services
 * over globals) would be rules about a style the rest of the code is
 * deliberately not written in: plain TypeScript and Svelte with `T |
 * undefined` optionals and `AbortSignal` callbacks.
 */
const effectFiles = [
  // packages/charts: Effect Schema parses the spec and emits its JSON Schema.
  'packages/charts/src/spec/parse.ts',
  'packages/charts/src/spec/internal/**',
  // packages/components: the `/entity-form` entry and its story / fixtures.
  'packages/components/src/lib/forms/entity-form.ts',
  'packages/components/src/lib/forms/EntityForm.svelte',
  'packages/components/src/stories/forms/entity-form-demo.ts',
  'packages/components/src/stories/forms/EntityForm.stories.svelte',
  'packages/components/tests/forms/fixtures/entity-form-definitions.ts',
];

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
      // (`svelte-kit sync` + svelte-check; `tsc` in packages/charts). A pure graph node — the root
      // depends on every package purely so this edge reaches them.
      check: {
        command: "echo 'check: all type gates green'",
        dependsOn: [{ from: 'dependencies', task: 'check' }],
        cache: false,
      },
      // Every package's suite in ONE vitest process (the `test.projects`
      // below), under one Istanbul coverage map, `coverage/coverage-final.json`,
      // which `fallow audit` reads for exact per-function CRAP scores
      // (`health.coverage` in .fallowrc.json). Without it fallow estimates
      // every function as uncovered, and any function with cyclomatic
      // complexity >= 5 fails the audit on its own. Not a CI gate: the gate is
      // `vp run -r test:unit`; run this before `fallow audit` (the PreToolUse
      // fallow gate runs the audit but never refreshes the map).
      //
      // Each package's own `test:unit` gets its `sync` / sibling `build` edges
      // from its own task; this one process gets them named here: both Svelte
      // packages' `svelte-kit sync`, and packages/components' `build`, whose
      // `dist/` the packages/mapbox suite imports through `exports`.
      'test:coverage': {
        command: 'vp test run --coverage',
        dependsOn: [
          '@thomasfosterau/components#sync',
          '@thomasfosterau/components#build',
          '@thomasfosterau/components-mapbox#sync',
        ],
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
      'packages/charts/schema/**',
    ],
    options: {
      typeAware: false,
      typeCheck: false,
    },
    // `vite-plus/oxlint-plugin`: `prefer-vite-plus-imports` keeps tests on
    // `vite-plus/test` rather than `vitest` (one toolchain, one import path).
    // `@mpsuesser/oxlint-plugin-effect` is registered here but enables nothing
    // globally; its rules are switched on for `effectFiles` only, below.
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      ...effect.configs.recommended.jsPlugins,
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    // Nothing that ships may import a module SvelteKit only resolves inside an
    // app (AGENTS.md § Common pitfalls). The package tsconfigs extend
    // `$app/tsconfig`, whose `$app/types` declares `$app/*` ambiently, so
    // `svelte-check` no longer rejects such an import; this rule does (#55).
    overrides: [
      {
        files: ['packages/*/src/lib/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              // Exact package names, which fallow's rule pack cannot ban
              // without also banning their subpaths: packages/mapbox reaches
              // the core only through `/canvas` (the other subpaths are
              // banned in fallow-rules.json), and no package imports itself
              // or @thomasfosterau/charts by name.
              paths: [
                {
                  name: '@thomasfosterau/components',
                  message:
                    'Import a family by relative path inside packages/components; packages/mapbox reaches the core only through @thomasfosterau/components/canvas.',
                },
                {
                  name: '@thomasfosterau/charts',
                  message: 'The Svelte packages are independent of @thomasfosterau/charts.',
                },
              ],
              patterns: [
                {
                  group: ['$app/**', '$env/**', '$service-worker'],
                  message:
                    'SvelteKit resolves this only inside an app; take it as a prop or from getComponentsContext() instead.',
                },
              ],
            },
          ],
        },
      },
      // The Effect presets, scoped to the files that import Effect (see
      // `effectFiles` above). `effect.configs.recommended` is
      // `@mpsuesser/oxlint-plugin-effect`'s syntactic rule set, all `error`.
      // `effectTsgoRecommended` is the Effect Language Service's rule set,
      // run by the Effect-patched oxlint (`effect-tsgo patch --oxlint`, the
      // root `prepare`); its rules are type-aware, so like the rest of
      // type-aware linting here (`typeAware: false` above) they stay dormant,
      // and the same diagnostics reach packages/charts through the patched
      // `tsc` instead (its tsconfig's `@effect/language-service` plugin).
      {
        files: effectFiles,
        plugins: effectTsgoRecommended.plugins,
        rules: {
          ...effectTsgoRecommended.rules,
          ...effect.configs.recommended.rules,
          // Hard-codes abbreviations (`Arr`, `P`, `R`, …) with no options,
          // so it is unsatisfiable under the full-name convention
          // (`import * as Schema from 'effect/Schema'`) the owner's Effect
          // repos share (effect-web's config turns it off for the same
          // reason).
          'effect/prefer-namespace-imports': 'off',
        },
      },
      // The `/entity-form` renderer and its story are Svelte components in the
      // core package, which may import `@thomasfosterau/effect-forms-svelte`'s
      // `createForm` and types but never `effect` itself: `effect` is a peer
      // of the form library, not of `@thomasfosterau/components`, so an
      // import of it here would be an undeclared dependency of the published
      // package (packages/components/CLAUDE.md § Boundary). Every fix these
      // three rules offer is an `effect` import (`Option`, `effect/Record`,
      // `Predicate.isTagged` / `Match`), so none can apply here; and a
      // component's optional props are `T | undefined` by the workspace's
      // `exactOptionalPropertyTypes` convention (AGENTS.md § Conventions),
      // which `prefer-option-over-null` would turn into `Option<T>` props that
      // every caller would need `effect` to pass.
      {
        files: ['packages/components/src/**/forms/EntityForm*.svelte'],
        rules: {
          'effect/prefer-option-over-null': 'off',
          'effect/avoid-native-object-helpers': 'off',
          'effect/avoid-direct-tag-checks': 'off',
        },
      },
      // `parseSpec` / `validateSpec` take arbitrary JSON and `encodeSpec`
      // returns it: they ARE the parse boundary these two rules ask callers
      // to go through, and `unknown` in their published signatures is the
      // contract (the package keeps every Effect type out of its `.d.ts`, so
      // there is no schema-typed input to accept instead).
      {
        files: ['packages/charts/src/spec/parse.ts'],
        rules: {
          'effect/no-unknown-parameters': 'off',
          'effect/no-unknown-returns': 'off',
        },
      },
    ],
  },

  // The root vitest run behind `test:coverage`: each package's own
  // vite.config.ts is one project (browser mode for the Svelte packages, Node
  // for packages/charts), so one run covers all three.
  test: {
    projects: ['packages/*/vite.config.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text-summary', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/lib/**/*.{ts,svelte}', 'packages/charts/src/**/*.{ts,tsx,svelte}'],
      exclude: ['**/*.d.ts'],
    },
  },

  // Oxfmt — formatter of record for the workspace. `.svelte` files are outside
  // its remit and are kept in the same style by hand. `sortTailwindcss` is on
  // because this is a Tailwind library: class order is a diff-noise source
  // otherwise, and a literal lookup table (see AGENTS.md) is exactly the shape
  // it can sort.
  // `packages/charts/schema/` is generated: its formatting is owned by that
  // package's `emit-schema` task, and a test compares it to the emitter's
  // output, so the formatter must not touch it.
  fmt: {
    ignorePatterns: [
      '**/dist/**',
      '**/.svelte-kit/**',
      '**/storybook-static/**',
      'packages/charts/schema/**',
    ],
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

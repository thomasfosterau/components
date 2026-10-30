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
import effect from '@enfect/oxlint';
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
  // oxfmt-supported types get format (with fixes) then lint. Lint runs WITHOUT
  // `--fix`: with type-aware lint on, `--fix` would apply type-aware autofixes
  // (even of `warn` rules such as `no-unnecessary-type-assertion`) to staged
  // files at commit time, so the commit would differ from the tree the gates
  // ran on. `--no-error-on-unmatched-pattern` lets a commit of only
  // `.md` / `.json` / `.css` pass the lint step, which selects no file there.
  staged: {
    '*.{js,ts,css,json,md}': [
      'vp check --fix --no-lint',
      'vp check --no-fmt --no-error-on-unmatched-pattern',
    ],
    '*.svelte': 'vp lint --no-error-on-unmatched-pattern',
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

  // Oxlint, type-aware through oxlint-tsgolint (bundled with vite-plus, and
  // patched by `effect-tsgo patch --oxlint` so the `effecttsgo/*` rules run).
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
      typeAware: true,
      // OFF, measured: tsgolint reads `.ts` files only, so every `.svelte`
      // import resolves to the ambient `*.svelte` module declaration. With it
      // on, the Svelte packages report 18 TS2614 (named `<script module>`
      // exports it cannot see) and 21 TS7006 (callback props typed through
      // those imports); the patched TS7 `tsc` reports the same 39 on
      // packages/components. svelte-check, which reads `.svelte` through
      // svelte2tsx, and packages/charts' patched `tsc` are already the type
      // gate (`vp run check`), so `typeCheck` would only duplicate them with
      // false errors. The type-aware RULES above still run on every `.ts`.
      typeCheck: false,
    },
    // `vite-plus/oxlint-plugin`: `prefer-vite-plus-imports` keeps tests on
    // `vite-plus/test` rather than `vitest` (one toolchain, one import path).
    // `@enfect/oxlint` is registered here but enables nothing globally; its
    // rules are switched on for `effectFiles` only, below.
    // Oxlint's `correctness`, `suspicious` and `perf` categories, over its
    // TypeScript, unicorn, oxc, import, promise, Vitest and JSDoc plugins.
    plugins: ['typescript', 'unicorn', 'oxc', 'import', 'promise', 'vitest', 'jsdoc'],
    categories: { correctness: 'error', suspicious: 'error', perf: 'error' },
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      ...effect.configs.recommended.jsPlugins,
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      // TSDoc's `@defaultValue` (every defaulted prop, AGENTS.md
      // § Conventions) and the `@module` file headers.
      'jsdoc/check-tag-names': ['error', { definedTags: ['defaultValue', 'module'] }],
      // Vitest's `expect(value, message)` takes the failure message second.
      'vitest/valid-expect': ['error', { maxArgs: 2 }],
      // `_tag` is the discriminant `@thomasfosterau/effect-forms-svelte`'s
      // results carry; the components read it, they don't name it.
      'no-underscore-dangle': ['error', { allow: ['_tag'] }],
      // Imported for their side effect: stylesheets (Storybook's preview, the
      // layout fixtures that load the theme) and the jest-dom matcher
      // registration in each browser suite's tests/setup.ts.
      'import/no-unassigned-import': [
        'error',
        { allow: ['**/*.css', '@testing-library/jest-dom/vitest'] },
      ],
      // Every flagged function is an exhaustive `switch` over a union, which
      // the compiler already proves returns on every path
      // (`noImplicitReturns` would flag a missing case); the rule cannot see
      // exhaustiveness, so it can only report false positives here.
      'typescript/consistent-return': 'off',
      // `Snippet<[]>` spells out "a snippet that takes no arguments", the
      // form AGENTS.md § Conventions documents for every `children` prop; the
      // rule would rewrite it to a bare `Snippet`.
      'typescript/no-unnecessary-type-arguments': 'off',
      // `SpecValidationError`'s constructor narrows `Error`'s optional
      // `message` to a required one: a signature change, not a redundant
      // constructor, which is the only shape this rule reports here.
      'no-useless-constructor': 'off',
      // Staged adoption of the categories above (#310): the sites
      // these rules found when they were turned on, at `warn` until the
      // follow-up pays them down. A new site is a defect, not headroom; a rule
      // whose count reaches zero goes back to `error` and its line is deleted.
      'typescript/no-unsafe-type-assertion': 'warn', // 122 sites, mostly test doubles and DOM lookups
      'vitest/require-mock-type-parameters': 'warn', // 74 sites, `vi.fn()` without a signature
      'vitest/no-conditional-expect': 'warn', // 25 sites, packages/charts error-shape tests
      'typescript/no-unnecessary-type-assertion': 'warn', // 4 sites; two `Intl.ListFormat` locales casts TS6 (svelte-check) still needs
      'unicorn/consistent-function-scoping': 'warn', // 5 sites, 4 in `.svelte`
      'unicorn/no-array-sort': 'warn', // 5 sites; `toSorted` raises the published browser baseline
      'unicorn/no-array-reverse': 'warn', // 1 site, same reason
      'promise/always-return': 'warn', // 4 sites
      'no-shadow': 'warn', // 2 sites, both in `.svelte`
      'oxc/no-accumulating-spread': 'warn', // 2 sites, hotkeys/match.ts
      'oxc/no-map-spread': 'warn', // 1 site, a story
      'vitest/require-to-throw-message': 'warn', // 1 site
    },
    // Nothing that ships may import a module SvelteKit only resolves inside an
    // app (AGENTS.md § Common pitfalls). The package tsconfigs extend
    // `$app/tsconfig`, whose `$app/types` declares `$app/*` ambiently, so
    // `svelte-check` no longer rejects such an import; this rule does (#55).
    overrides: [
      // The tests drive a UI step by step, so an `await` in a loop is the
      // point (each press must land before the next), and the `mapbox-gl`
      // doubles are `vi.mock` classes whose only job is to exist or throw.
      {
        files: ['packages/*/tests/**'],
        rules: {
          'no-await-in-loop': 'off',
          'typescript/no-extraneous-class': 'off',
        },
      },
      // The Svelte packages' browser suites register
      // `@testing-library/jest-dom/vitest` (tests/setup.ts), whose matcher
      // types return `void` and shadow the `Promise<void>` that Vitest browser
      // mode's `expect.element(...)` declares for the same names, so tsgolint
      // reads every awaited assertion as awaiting a non-promise (1,177 sites
      // when type-aware lint was turned on). The `await` is required: the
      // assertion retries. Dropping jest-dom is not a type-only change,
      // because its runtime matchers differ too (its `toHaveTextContent`
      // matches a substring or RegExp, Vitest 5's compares the whole text).
      {
        files: ['packages/components/tests/**', 'packages/mapbox/tests/**'],
        rules: { 'typescript/await-thenable': 'off' },
      },
      // `'<' + '/script>'` is split on purpose, so neither the Svelte compiler
      // nor an HTML parser reading the file sees the end of its own `<script>`.
      {
        files: ['**/seo/JsonLd.svelte', '**/seo/JsonLd.stories.svelte'],
        rules: { 'no-useless-concat': 'off' },
      },
      // A chord carries at most three modifiers, so an array's `includes`
      // beats hashing a `Set` on every keystroke (the comment at the site).
      {
        files: ['packages/components/src/lib/hotkeys/match.ts'],
        rules: { 'unicorn/prefer-set-has': 'off' },
      },
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
      // `@enfect/oxlint`'s rule set (anti-slop included), all `error`.
      // `effectTsgoRecommended` is the Effect Language Service's rule set,
      // run by the Effect-patched oxlint and tsgolint (`effect-tsgo patch
      // --oxlint`, the root `prepare`) now that type-aware linting is on; the
      // same diagnostics also reach packages/charts through the patched `tsc`
      // (its tsconfig's `@effect/language-service` plugin).
      {
        files: effectFiles,
        plugins: effectTsgoRecommended.plugins,
        rules: {
          ...effectTsgoRecommended.rules,
          ...effect.configs.recommended.rules,
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

/**
 * Workspace-wide format, lint and staged checks, and the aggregate `ci`,
 * `check` and `test:coverage` tasks. Each package's own vite.config.ts
 * builds and tests it.
 */

import { recommended as effectTsgoRecommended } from '@effect/tsgo/oxlint-presets';
import effect from '@enfect/oxlint';
import { defineConfig } from 'vite-plus';

/** The files that use Effect; the Effect lint presets apply to these. Add a file when it starts using Effect. */
const effectFiles = [
  // packages/charts: Effect Schema parses the spec and emits its JSON Schema.
  'packages/charts/src/spec/parse.ts',
  'packages/charts/src/spec/internal/**',
  // packages/import: the core, its `@effect/vitest` suite, and the UI's
  // `session.ts`, which runs the core. The UI components stay plain Svelte.
  'packages/import/src/*.ts',
  'packages/import/src/svelte/*.ts',
  'packages/import/tests/*.ts',
  // packages/components: the `/entity-form` entry and its story / fixtures.
  'packages/components/src/lib/forms/entity-form.ts',
  'packages/components/src/lib/forms/EntityForm.svelte',
  'packages/components/src/stories/forms/entity-form-demo.ts',
  'packages/components/src/stories/forms/EntityForm.stories.svelte',
  'packages/components/tests/forms/fixtures/entity-form-definitions.ts',
];

export default defineConfig({
  // oxfmt can't format `.svelte`, so those are only linted. Lint runs without
  // `--fix` so a commit never differs from the tree the gates checked.
  staged: {
    '*.{js,ts,css,json,md}': [
      'vp check --fix --no-lint',
      'vp check --no-fmt --no-error-on-unmatched-pattern',
    ],
    '*.svelte': 'vp lint --no-error-on-unmatched-pattern',
  },

  run: {
    tasks: {
      // What ci.yml runs. `sync` first: the type-aware lint and svelte-check
      // read it. The browser suites install Chromium through `browser:install`.
      ci: {
        command:
          'vp run -r sync && vp check && vp run check && vp run -r test:unit && vp run -r build && vp run --filter ./packages/components storybook:build && pnpm audit --audit-level high',
        cache: false,
      },
      // The Chromium the pinned `playwright` expects, for the browser suites,
      // which depend on this task; a no-op when it is already installed.
      // Skipped when `PLAYWRIGHT_CHROMIUM_EXECUTABLE` names a preinstalled
      // Chromium (an agent session's /opt/pw-browsers/chromium), and the
      // system libraries too only where `PLAYWRIGHT_INSTALL_DEPS` is set (the
      // devcontainer).
      'browser:install': {
        command:
          'bash -c \'[ -n "${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-}" ] || playwright install ${PLAYWRIGHT_INSTALL_DEPS:+--with-deps} chromium\'',
        cache: false,
      },
      // Fallow's change-set audit, run by the pre-commit hook; it reads the coverage map.
      'fallow:audit': {
        command: 'vp exec fallow audit --base origin/trunk --quiet',
        dependsOn: ['test:coverage'],
        cache: false,
      },
      // Every package's `check`, reached through the root's workspace dependencies.
      check: {
        command: "echo 'check: all type gates green'",
        dependsOn: [{ from: 'dependencies', task: 'check' }],
        cache: false,
      },
      // Every suite in one run with one Istanbul map, which `fallow audit`
      // reads. Not a CI gate. The Svelte suites need `sync`, and mapbox's
      // imports packages/components' `dist/`. `--maxWorkers=1` runs one file
      // at a time: the browser projects in parallel exhaust Chromium's memory.
      'test:coverage': {
        command: 'vp test run --coverage --maxWorkers=1',
        dependsOn: [
          'browser:install',
          '@thomasfosterau/components#sync',
          '@thomasfosterau/components#build',
          '@thomasfosterau/components-mapbox#sync',
        ],
        cache: false,
      },
    },
  },

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
      // tsgolint can't read `.svelte`, so it reports false errors on every
      // `.svelte` import; svelte-check and `tsc` are the type gate.
      typeCheck: false,
    },
    // `@enfect/oxlint` enables nothing globally; see `effectFiles` below.
    plugins: ['typescript', 'unicorn', 'oxc', 'import', 'promise', 'vitest', 'jsdoc'],
    categories: { correctness: 'error', suspicious: 'error', perf: 'error' },
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      ...effect.configs.recommended.jsPlugins,
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
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
      // It can't see that an exhaustive `switch` over a union returns on every path.
      'typescript/consistent-return': 'off',
      // `Snippet<[]>` is the house spelling for a snippet with no arguments.
      'typescript/no-unnecessary-type-arguments': 'off',
    },
    overrides: [
      // UI tests await each step in turn; the `mapbox-gl` doubles are empty classes.
      {
        files: ['packages/*/tests/**'],
        rules: {
          'no-await-in-loop': 'off',
          'typescript/no-extraneous-class': 'off',
        },
      },
      // jest-dom's matcher types return `void`, shadowing the `Promise` that
      // browser mode's retrying `expect.element` returns; the `await` is needed.
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
      // At most three modifiers: `includes` beats hashing a `Set` per keystroke.
      {
        files: ['packages/components/src/lib/hotkeys/match.ts'],
        rules: { 'unicorn/prefer-set-has': 'off' },
      },
      // Shipped code can't import what SvelteKit only resolves inside an app.
      {
        files: ['packages/*/src/lib/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              // Bare names only; fallow-rules.json bans the subpaths.
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
      // The Effect presets, for `effectFiles` only.
      {
        files: effectFiles,
        plugins: effectTsgoRecommended.plugins,
        rules: {
          ...effectTsgoRecommended.rules,
          ...effect.configs.recommended.rules,
          // Pinned so a preset change can't drop them.
          'effect/prefer-namespace-imports': 'error',
          'effect/prefer-option-over-null': 'error',
          'effect/no-conditional-empty-object-spread': 'error',
        },
      },
      // Svelte props stay `T | undefined` (an `Option` prop would make every
      // caller import `effect`), as does the form library's input record.
      {
        files: ['packages/components/src/lib/forms/EntityForm.svelte'],
        rules: {
          'effect/prefer-option-over-null': 'off',
        },
      },
      // A module augmentation of `effect/Schema` must restate its names.
      {
        files: ['packages/import/src/annotations.ts'],
        rules: { 'no-shadow': 'off' },
      },
      // `@effect/vitest` marks `it` itself unstable.
      {
        files: ['packages/import/tests/*.ts'],
        plugins: effectTsgoRecommended.plugins,
        rules: { 'effecttsgo/unstable-api-usage': 'off' },
      },
      // `SourceCell` is a plain per-cell value: an `Option` per cell of a whole
      // workbook would allocate a wrapper each and force adapters onto `effect`.
      {
        files: ['packages/import/src/table.ts'],
        rules: { 'effect/prefer-option-over-null': 'off' },
      },
      // `session.ts` is where the UI meets the engine: its types are the
      // components' props (so `T | undefined`), and running each Effect as a
      // promise is its job.
      {
        files: ['packages/import/src/svelte/session.ts'],
        rules: {
          'effect/prefer-option-over-null': 'off',
          'effect/effect-run-in-body': 'off',
        },
      },
      // `parseSpec` / `validateSpec` / `encodeSpec` are the JSON parse boundary,
      // and no Effect type may reach the published signatures.
      {
        files: ['packages/charts/src/spec/parse.ts'],
        rules: {
          'effect/no-unknown-parameters': 'off',
          'effect/no-unknown-returns': 'off',
          // `SpecValidationError`'s constructor narrows `message` to required.
          'no-useless-constructor': 'off',
        },
      },
    ],
  },

  // The `test:coverage` run: each package's config is one project, plus
  // packages/import's browser suite for `./svelte`.
  test: {
    projects: ['packages/*/vite.config.ts', 'packages/import/vite.svelte.config.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text-summary', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      include: [
        'packages/*/src/lib/**/*.{ts,svelte}',
        'packages/charts/src/**/*.{ts,svelte}',
        'packages/import/src/**/*.{ts,svelte}',
      ],
      exclude: ['**/*.d.ts'],
    },
  },

  // The schema is generated (a test compares it); CHANGELOG.md is written by
  // the release bot, where no format step runs.
  fmt: {
    ignorePatterns: [
      '**/CHANGELOG.md',
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

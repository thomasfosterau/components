# Contributing

## Workflow

- Branch off `trunk` and open a pull request into `trunk`; it is squash-merged. Never commit to `trunk` directly.
- Open a draft PR as soon as you start, so others can see the work. Keep one PR per change, even a large one, and keep it free of conflicts (rebase onto `origin/trunk`; don't merge `trunk` in). Getting CI green is the author's job.
- Found something out of scope? File an issue and move on. Keep issue bodies evergreen: context, problem and suggested fix in the body, not in a trail of comments.
- Dependabot updates dependencies daily. Update one by hand only when your change needs it, or for the moves Dependabot can't make, which go in a PR from a new branch started from its PR's head (never push to a `dependabot/*` branch, which stops it rebasing; Dependabot closes its own PR once yours merges):
  - When a `toolchain` update bumps `vite-plus`: set the `vite` alias (`npm:@voidzero-dev/vite-plus-core@<version>`) to the same version, and the `.devcontainer/devcontainer.json` image tag with it.
  - `typescript` (TS6) and `@typescript/native` (TS7) are npm aliases: move them with `@effect/tsgo`, to versions its `components` table (`node_modules/@effect/tsgo/dist/effect-tsgo.cjs`) supports, or `pnpm install`'s `prepare` fails.

## Toolchain

[Vite+](https://viteplus.dev) (`vp`) manages Node, pnpm and every tool. Use `vp` rather than `pnpm`/`npx` (`vp exec <bin>`, `vp run <task>`); the exception is `pnpm changeset`. The release runs `vp run release` (`vp pm publish -r`, then `changeset git-tag`); `vp run release:dry-run` shows what it would publish.

- Every external version lives in the `pnpm-workspace.yaml` catalog; a `package.json` names only `catalog:`, `catalog:peers` or `workspace:*`, except that a companion package takes `@thomasfosterau/components` as a `workspace:^` peer (and a `workspace:*` dev dependency) so apps keep one copy and one context. After editing the catalog, run `vp install` and commit `pnpm-lock.yaml`.
- `vp install` also patches `tsc`/oxlint with `@effect/tsgo`.
- The browser suites need the exact Chromium the pinned `playwright` expects. Their tasks depend on the root `browser:install` task, which installs it on first use; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use a Chromium you already have instead.
- `vp install` also installs the git hooks: pre-commit runs `vp staged` (format and lint the staged files), then `vp run fallow:audit`.
- [Fallow](https://fallow.tools) checks dead code, duplication, complexity and the import boundaries (`.fallowrc.json`, `fallow-rules.json`). `vp run fallow:audit` audits your change against `origin/trunk` (after refreshing the coverage map it reads), and blocks the commit on a `fail` verdict. Its findings are guidance, not dogma, but the boundaries are real.

| Command | What it does |
| --- | --- |
| `vp check` | Format and lint (Oxfmt, type-aware Oxlint). `--fix` to fix. |
| `vp run check` | The type gate: svelte-check, and `tsc` for charts and import. |
| `vp run -r test:unit` | Every suite: Svelte packages in headless Chromium, charts and import under Node. |
| `vp run -r build` | Every package's `dist/`. |
| `vp run --filter ./packages/components storybook` | Storybook on port 6006 (`storybook:build` for the static build). |
| `vp run ci` | Everything CI runs, in order. |
| `vp run release:dry-run` | Builds every package and shows what `vp run release` would publish. |

## Coding guidelines

### Svelte packages

`dist/` is the product: `src/lib/` ships, nothing there may import `$app/*` or `$env/*` (a lint rule enforces it), and every emitted module must be side-effect free (`"sideEffects": false`).

- Svelte 5 runes and snippets only. Spread the rendered element's native attributes and merge `class` last (`class={['…', className]}`), so `id`, `aria-*` and `data-*` always reach the element.
- Every string is a prop with an English default; accessible-name props end in `Label`. Links and locale come from `getComponentsContext()`.
- Optional props are `T | undefined` (`exactOptionalPropertyTypes` is on).
- daisyUI classes come from a literal lookup table (`Record<Variant, string>`), never a template string: Tailwind only sees complete class names. Use semantic tokens (`bg-base-200`), never raw colours.
- Anything with focus management, keyboard semantics or a popover builds on bits-ui.
- Accessible name, role and state are part of a component's API and are pinned by a browser test. Every component has a story (`src/stories/<family>/`) and a test (`tests/<family>/`).
- `.svelte` files are formatted by hand: two spaces, single quotes, semicolons.
- A component that needs a specific third-party dependency gets its own package (as `packages/mapbox` does for `mapbox-gl`).

### Effect

Use Effect wherever it makes the code better. The one rule: using these packages must not require writing Effect code, where practical. Public surfaces (component props, callbacks, exported functions and types) take and return plain values: `T | undefined` rather than `Option`, `(…, signal: AbortSignal) => Promise<T>` rather than an `Effect`, a returned or thrown error rather than an Effect error channel. Run the Effect inside and adapt at that edge, as `packages/import/src/svelte/session.ts` does. The exceptions are entries built for Effect apps: `packages/import`'s core, whose API is Effect, and `/entity-form`, which renders an Effect form definition. Importing `effect` from an entry that didn't before can turn an optional peer into a required one: check the package's `peerDependenciesMeta` and say so in the changeset.

In Effect code, use Effect idioms throughout and strongly prefer Effect v4's own modules (`Option`, `Array`, `Match`, `Schema`, `Stream`, tagged errors) over hand-rolled equivalents; convert existing code where practical. Exceptions: Svelte component code, non-Effect third-party APIs (adapt them at the edge), and hot paths where measured performance needs plain code. If you find non-idiomatic code you can't fix trivially, file an issue listing the sites and the idiomatic replacement.

The Effect lint rules apply to the files listed in `effectFiles` (root `vite.config.ts`); add a file there when it starts using Effect. They require namespace imports under the canonical aliases (`Arr`, `P`, `R`, `Str`, `Eq`, `Bool`), `Option` for absence, explicit construction instead of conditional empty spreads. Read `node_modules/effect/dist/*.d.ts` rather than guessing at an API.

### Comments

- A file-level comment only when it gives context the code can't, in under 50 words.
- Doc comments where they help a consumer's IntelliSense: a `<!-- @component … -->` line and a `/** … */` per prop (with `@defaultValue` where the destructuring sets one).
- Inline comments only for workarounds and non-obvious decisions.
- No references to issues, PRs or history in code or docs. Stable links to external docs are fine.

### Tests

Test logic and behaviour that can regress: keyboard handling, focus, ARIA, edge cases. Don't test what the type system or a lint rule already guarantees, or trivial code. Tests import from `vite-plus/test` (Effect suites use `@effect/vitest`).

## Before pushing

Run `vp run ci` (or the gates one by one: `vp check`, `vp run check`, `vp run -r test:unit`, `vp run -r build`, `vp run --filter ./packages/components storybook:build`, `pnpm audit --audit-level high`). Say in the PR body which gates you couldn't run and why.

## Changesets

Every change to a published package's behaviour, or to doc comments that reach its `.d.ts`, needs a changeset: `pnpm changeset`, committed with the change. Tooling, CI and docs-only changes need none. Never version or publish by hand: the Release workflow opens a "chore: version packages" PR and the owner merges it ([PUBLISHING.md](PUBLISHING.md)).

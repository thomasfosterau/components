# Contributing

Maintained by Thomas Foster, with a workflow meant to work for people and coding agents alike. The conventions are in [AGENTS.md](./AGENTS.md); each package's boundary and invariants are in its `CLAUDE.md`.

## Setup

You need Node (`^22.18.0`, `^24.11.0` or `>=26`) and pnpm 11 (the exact version is `packageManager` in `package.json`; [Corepack](https://nodejs.org/api/corepack.html) picks it up).

```sh
pnpm install                                   # dependencies, git hooks, the effect-tsgo patch
pnpm exec playwright install chromium          # the browser the Svelte packages' suites drive
```

The toolchain is [Vite+](https://viteplus.dev) (the `vp` CLI): `vp check` formats and lints, `vp run <task>` runs the task graph defined in the `vite.config.ts` files, and `vp test` is Vitest. Every external version is in the catalog in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml); a `package.json` carries only `catalog:`, `catalog:peers` or `workspace:*`.

## Git hooks

`pnpm install` installs the Vite+ hooks. **pre-commit** runs `vp staged`: format (with fixes) and lint (without fixes, so no type-aware autofix lands unverified) on the staged files (`.svelte` files are linted only; they are formatted by hand, see [AGENTS.md § Conventions](./AGENTS.md#conventions)). There is no pre-push hook.

## Running individual checks

```sh
vp check                                            # format + lint (oxfmt + oxlint)
vp check --fix                                      # ...and fix what can be fixed
vp run check                                        # the type gate: svelte-check, and tsc for charts
vp run --filter ./packages/charts check             # one package's type gate
vp run -r test:unit                                 # every suite
vp test run tests/ui/Button.test.ts                 # one file (from inside its package)
vp run -r build                                     # dist/ for all three packages
vp run --filter ./packages/components storybook     # Storybook dev server on port 6006
vp run --filter ./packages/components storybook:build
vp run test:coverage                                # one Istanbul map, for fallow
pnpm run fallow                                     # dead code, duplication, complexity, boundaries
fallow audit --base origin/trunk                    # the change-set review (not a CI gate)
pnpm audit --audit-level high
```

## CI

[`ci.yml`](./.github/workflows/ci.yml) runs one job whose steps are the gates in [AGENTS.md § Verification](./AGENTS.md#verification), in order. [`release.yml`](./.github/workflows/release.yml) versions and publishes (see [PUBLISHING.md](./PUBLISHING.md)); [`chartspeckit.yml`](./.github/workflows/chartspeckit.yml) runs the Swift `ChartSpecKit` tests on macOS when that package or the chart schema changes. Every workflow defaults to `permissions: {}` and grants each job only what it uses, pins each action to a commit SHA, checks out without persisted credentials (except Release, whose Changesets step pushes), sets up Node as `'*'` with `check-latest` (never `latest`, which can resolve to a pre-release), and never runs the Release job (the only one holding `id-token: write`) for Dependabot; CI needs no secret, so Dependabot PRs run it safely. `uvx zizmor --offline .github` audits the workflows (config in `.github/zizmor.yml`).

## Before you open a pull request

1. Run the gates in [AGENTS.md § Verification](./AGENTS.md#verification) and note each result in the pull request.
2. Add a changeset (`pnpm changeset`) where [AGENTS.md § Branches and pull requests](./AGENTS.md#branches-and-pull-requests) asks for one.
3. Rebase onto `trunk`: `git fetch origin trunk && git rebase origin/trunk`. Don't merge `trunk` into your branch.
4. Update the docs: the package `README.md` for any change to what a package exports, the package `CLAUDE.md` for a new term or invariant, and a story and a browser test for a new component.

Security issues go through [SECURITY.md](./SECURITY.md), not a public issue.

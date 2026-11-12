# Contributing

Maintained by Thomas Foster, with a workflow meant to work for people and coding agents alike. The conventions are in [AGENTS.md](./AGENTS.md); each package's boundary and invariants are in its own `AGENTS.md`.

## Setup

You need Node (`^22.18.0`, `^24.11.0` or `>=26`) and pnpm 11 (the exact version is `packageManager` in `package.json`; [Corepack](https://nodejs.org/api/corepack.html) picks it up).

```sh
pnpm install                                   # dependencies, git hooks, the effect-tsgo patch
pnpm exec playwright install chromium          # the browser the Svelte packages' suites drive
```

Open in a Codespace or Dev Container: `.devcontainer/` provisions it with the same hook as agent sessions. The `Dev Container` workflow (`.github/workflows/devcontainer.yml`) builds it in CI whenever its inputs change; to try a change locally, `pnpm dlx @devcontainers/cli@0.89.0 up --workspace-folder .` (needs Docker).

The toolchain is [Vite+](https://viteplus.dev) (the `vp` CLI): `vp check` formats and lints, `vp run <task>` runs the task graph defined in the `vite.config.ts` files, and `vp test` is Vitest. Every external version is in the catalog in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml); a `package.json` carries only `catalog:`, `catalog:peers` or `workspace:*`.

## Git hooks

`pnpm install` installs the Vite+ hooks. **pre-commit** runs `vp staged`: format (with fixes) and lint (without fixes, so no type-aware autofix lands unverified) on the staged files (`.svelte` files are linted only; they are formatted by hand, see [AGENTS.md § Conventions](./AGENTS.md#conventions)). There is no pre-push hook.

## Commands

Invoke everything through `vp` — `vp run <script>`, `vp exec <bin>` (instead of `npx`). The sanctioned non-`vp` invocations: `pnpm install` (`pnpm install --frozen-lockfile` in CI), `pnpm changeset`, `pnpm audit`, the release path (`pnpm run release`: `pnpm pack` + `npm publish`), and `pnpm exec playwright install` (in CI, and in a session whose image lacks the pinned Chromium revision).

- `pnpm install` — dependencies, the Vite+ git hooks (pre-commit runs `vp staged`: format + lint on staged files) and the `effect-tsgo` patch (the root `prepare`). There is no pre-push hook.
- `vp check` — format + lint (Oxfmt + Oxlint over its `correctness`, `suspicious` and `perf` categories). Lint is type-aware through oxlint-tsgolint (`lint.options.typeAware`); `typeCheck` stays off because tsgolint cannot read `.svelte` (the reason is beside it in the root `vite.config.ts`). Every rule is at `error`: there is no `warn` tier and no inline disable, and a rule is turned `off` only for a genuine can't-apply, with the technical reason beside it (#310). `vp run check` — the type gate: every package's `check` (`svelte-kit sync` + `svelte-check`). They are different commands.
- `vp run -r test:unit` — every package's suite: the Svelte packages in headless Chromium under Vitest browser mode, `packages/charts` under Node.
- `vp run test:coverage` — every suite in one Vitest run, writing the Istanbul map `coverage/coverage-final.json` that `fallow audit` reads. Not a gate; run it before an audit.
- `vp exec fallow` (`pnpm run fallow`) — dead code, duplication, complexity and the import boundaries (`.fallowrc.json` zones, `fallow-rules.json` policy). `vp exec fallow audit --base origin/trunk` is the pre-commit check ([AGENTS.md § Fallow local gate](./AGENTS.md#fallow-local-gate)).
- `vp run -r build` — `svelte-package` → `packages/components/dist` and `packages/mapbox/dist`; `vp pack` → `packages/charts/dist`.
- `vp run --filter ./packages/components storybook:build` — the static Storybook build. `storybook` is the dev server on port 6006 (a long-running process; one Storybook for the workspace, see [packages/components/AGENTS.md](packages/components/AGENTS.md#storybook)).
- `pnpm changeset` — add a changeset.

As a quick reference:

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
vp exec fallow audit --base origin/trunk            # the change-set review (not a CI gate)
pnpm audit --audit-level high
```

## Branches, pull requests and changesets

- **Branches.** Branch off `trunk`; PR against `trunk`; squash-merge. Name branches `issue-<n>-<slug>` for issue-linked work, or a plain descriptive slug otherwise. Rebase onto `origin/trunk` before opening or updating a PR (`git fetch origin trunk && git rebase origin/trunk`); never merge `trunk` into your branch — merging lets git silently auto-resolve convergent edits between parallel branches, and GitHub's Update-branch button and auto-merge both merge.
- **Changesets.** Every change to a published package's behaviour carries a changeset (`pnpm changeset`); CI- and tooling-only changes need none. Changes to doc comments that reach the emitted `.d.ts` (TSDoc, `@component`) take a `patch` changeset; other docs-only changes (READMEs, guidance) need none. Never publish or version by hand: the Release workflow opens a "chore: version packages" PR (the Version Packages PR) and the owner merges it. `.changeset/config.json`'s `baseBranch` must say `trunk`.
- **Publishing.** Publishing is npm trusted publishing (OIDC) from the protected `release` environment; there is no `NPM_TOKEN`. The publish step is [`scripts/publish.mjs`](scripts/publish.mjs) (`pnpm pack` + `npm publish <tarball>`); its header says why it is kept. The flow and the one-time owner setup are in [PUBLISHING.md](PUBLISHING.md).

## CI

[`ci.yml`](./.github/workflows/ci.yml) runs one job whose steps are the gates in [AGENTS.md § Verification](./AGENTS.md#verification), in order. [`release.yml`](./.github/workflows/release.yml) versions and publishes (see [PUBLISHING.md](./PUBLISHING.md)); [`chartspeckit.yml`](./.github/workflows/chartspeckit.yml) runs the Swift `ChartSpecKit` tests on macOS when that package or the chart schema changes. Every workflow defaults to `permissions: {}` and grants each job only what it uses, pins each action to a commit SHA, checks out without persisted credentials (except Release, whose Changesets step pushes), sets up Node as `'*'` with `check-latest` (never `latest`, which can resolve to a pre-release), and never runs the Release job (the only one holding `id-token: write`) for Dependabot; CI needs no secret, so Dependabot PRs run it safely. `uvx zizmor --offline .github` audits the workflows (config in `.github/zizmor.yml`).

## Before you open a pull request

1. Run the gates in [AGENTS.md § Verification](./AGENTS.md#verification) and note each result in the pull request.
2. Add a changeset (`pnpm changeset`) where [§ Branches, pull requests and changesets](#branches-pull-requests-and-changesets) asks for one.
3. Rebase onto `trunk`: `git fetch origin trunk && git rebase origin/trunk`. Don't merge `trunk` into your branch.
4. Update the docs: the component's doc comments (`@component`, the header's ARIA contract, a `/** */` per prop) for any change to its API, the matching `docs/` guide when a how-to or decision guide changes, the package `README.md` only when its entry-point table changes, the package `AGENTS.md` for a new term or invariant, and a story and a browser test for a new component.

Security issues go through [SECURITY.md](./SECURITY.md), not a public issue.

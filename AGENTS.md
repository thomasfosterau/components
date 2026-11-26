# AGENTS.md

Read [README.md](README.md) and [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) first; they apply to agents too. Each package's own `AGENTS.md` covers its boundary and invariants.

## Process

- You may open PRs in this repository; follow the workflow in docs/CONTRIBUTING.md. Out-of-scope work you spot becomes an issue, not a detour.
- Use the GitHub MCP tools or `gh`, whichever is available. Write only to `thomasfosterau/components`.
- If a gate can't run in your session (no matching Chromium, no network, no Swift toolchain), say so in the PR body rather than implying it ran. A run against a different Chromium revision is evidence, not the gate.
- Never `git stash`: the stash is shared across worktrees. Use a WIP commit.
- Never publish by hand: the Release workflow runs `vp run release` (`vp pm publish -r`, then `changeset git-tag`); there is no publish script. `vp run release:dry-run` is safe to run.

## Pitfalls

- In Effect code, use Effect v4's own modules rather than re-inventing them (docs/CONTRIBUTING.md § Effect). File an issue for non-idiomatic code you can't fix trivially.

- Several catalog entries are npm aliases or exact lockstep pins (`vite`, `typescript`, `@typescript/native`, `vitest`, `@effect/tsgo`): read their comments in `pnpm-workspace.yaml` before moving any.
- On a fresh checkout, `vp run -r sync` before `vp check`: the type-aware lint reads the tsconfig `svelte-kit sync` generates.
- In a `.ts` browser test, `render(Component, props)` can't take a prop named `anchor`, `target`, `props`, `events`, `context` or `intro` (Svelte's mount options); nest those under `props:`.

## Pull requests

- **Write the PR body with the `pr` skill** from Matt Pocock's skills (`mattpocock-skills:pr`), filling in the repository's pull request template where there is one.
- **Resolve merge conflicts before you hand a PR over.** Rebase onto `origin/trunk` and push; a PR that conflicts with `trunk` isn't finished.
- **Mark the PR ready for review as soon as the initial draft is finished.** Don't wait for CI to run, for reviews, or for the owner to do it. Keep fixing CI failures and review findings on the ready PR.

## Fallow

The pre-commit hook runs `vp run fallow:audit`, which runs the test suites for coverage first, so commits are slow; don't bypass it. Fix what it reports rather than working around it.

The `fallow` agent skill is linked into `.claude/skills/` from the installed package after `vp install`.

# AGENTS.md

Read [README.md](README.md) and [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) first; they apply to agents too. Each package's own `AGENTS.md` covers its boundary and invariants.

## Process

- You may open PRs in this repository; follow the workflow in docs/CONTRIBUTING.md. Out-of-scope work you spot becomes an issue, not a detour.
- Use the GitHub MCP tools or `gh`, whichever is available. Write only to `thomasfosterau/components`.
- If a gate can't run in your session (no matching Chromium, no network, no Swift toolchain), say so in the PR body rather than implying it ran. A run against a different Chromium revision is evidence, not the gate.
- Never `git stash`: the stash is shared across worktrees. Use a WIP commit.

## Pitfalls

- In Effect code, use Effect v4's own modules rather than re-inventing them (docs/CONTRIBUTING.md § Effect). File an issue for non-idiomatic code you can't fix trivially.

- Several catalog entries are npm aliases or exact lockstep pins (`vite`, `typescript`, `@typescript/native`, `vitest`, `@effect/tsgo`): read their comments in `pnpm-workspace.yaml` before moving any.
- On a fresh checkout, `vp run -r sync` before `vp check`: the type-aware lint reads the tsconfig `svelte-kit sync` generates.
- In a `.ts` browser test, `render(Component, props)` can't take a prop named `anchor`, `target`, `props`, `events`, `context` or `intro` (Svelte's mount options); nest those under `props:`.

## Fallow

A PreToolUse hook runs `fallow audit` before `git commit` / `git push` and blocks on a `fail` verdict (only findings the change introduces count). Run `vp run test:coverage` first, or every function scores as uncovered. Fix the findings rather than working around the gate; `vp exec fallow explain <issue-type>` explains one.

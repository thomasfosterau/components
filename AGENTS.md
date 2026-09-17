# AGENTS.md

Project conventions live here; personal style preferences live in user memory.

This repo is a **publishable npm library**, not an application — the only artifact that matters is `packages/components/dist`, and everything below exists to keep that artifact small, typed and accessible. The toolchain, workspace shape, catalog discipline, task graph and session hook are copied from the owner's app repos (the Gardeneria / Website foundation) so a component authored here compiles identically in the app that consumes it; the three places the two deliberately differ are commented where they occur (`playwright`'s pin, the browser-mode test suite, and the absence of a stage/deploy graph).

## Common pitfalls

- **Never edit a version in a `package.json`.** Every external version lives in [`pnpm-workspace.yaml`](pnpm-workspace.yaml) under `catalog:`; package.json files carry only `catalog:` or `workspace:*`, and `catalogMode: strict` rejects anything else at install. After editing the catalog, run `pnpm install` and commit the regenerated `pnpm-lock.yaml` — a stale lockfile fails every CI job at once with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.
- **`dist/` is the product; `src/routes` does not exist.** This is a `svelte-package` library, not a SvelteKit app. There is no demo app, no adapter and no `app.html`. Nothing under `src/lib/` may import `$app/*`, `$env/*` or anything else SvelteKit only resolves inside an app — SvelteKit is here to run `svelte-kit sync` and `svelte-package`, nothing more.
- **`"sideEffects": false` is a claim about `dist/`, and it is load-bearing.** Every emitted `.js` must be pure declarations: no bare imports, no top-level `await`, no top-level statements. A `<script module>` block may only declare. It is what lets a consumer's bundler drop the components they don't use.
- **Accessibility regresses silently.** Type errors don't catch a lost accessible name, a broken focus order or a dropped `aria-*` relationship. That is the whole reason the suite drives a real browser.

## Conventions

- **Svelte 5 runes and snippets only.** `$props`, `$state`, `$derived`, `$effect`, `{#snippet}` / `{@render}`. No `export let`, no slots, no stores in component code, no legacy event directives.
- **Every component spreads the native attributes of the element it renders and merges `class`.**

  ```svelte
  interface Props extends HTMLAttributes<HTMLSpanElement> {
    children: Snippet<[]>;
  }
  let { children, class: className, ...rest }: Props = $props();
  ```

  ```svelte
  <span {...rest} class={clsx('sr-only', className)}>{@render children()}</span>
  ```

  `clsx` merges; the caller's `class` goes **last**, so Tailwind's later-wins ordering lets them override anything. A component that swallows `id`, `aria-*` or `data-*` is a bug — a consumer cannot label, test or hook into it.

- **daisyUI classes come from a literal lookup table, never a template string.** Tailwind 4 extracts classes by scanning source text, so ``class={`btn-${variant}`}`` emits nothing at all:

  ```ts
  const variantClasses: Record<Variant, string> = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
  };
  ```

  Same rule for sizes, colours and states. A `Record<K, string>` of complete class names is the only form that survives the scan, and it is also the form `sortTailwindcss` can order.

- **Semantic tokens only.** `bg-base-200`, `text-error`, `btn-primary` — never `bg-green-700`, a hex or an `oklch()` inside a component. The vocabulary is [`packages/components/src/lib/theme.css`](packages/components/src/lib/theme.css); two vocabularies for one palette is how a design system drifts.
- **bits-ui owns interaction.** Anything with focus management, keyboard semantics, a popover, or an ARIA relationship between elements is built on a bits-ui primitive rather than hand-rolled. Hand-rolling is the exception, and it needs a reason in the component's header comment.
- **ARIA is part of the contract, not decoration.** A component's accessible name, role and state are its public API as much as its props are, and they are pinned by a test.
- **Every component ships with a story and a browser test.** One `*.stories.svelte` / `*.stories.ts` per component under `src/stories/<group>/`, mirroring `src/lib/<group>/` — not beside the component, because `svelte-package` copies every `src/lib/` file into `dist/` and stories must not ship. Snippet-taking components use Svelte CSF (`defineMeta` + `<Story>`), prop-only ones plain CSF.
- **Prefer vertical slices per component** over horizontal sweeps: component → barrel export → story → test → README row, finished, before starting the next.

## Documentation surfaces

Durable knowledge has one home each: a **decision, findings report, or invariant** discovered while working an issue is recorded **as a comment on that issue** (later comments override the body); a **rule that must be visible when touching certain files** goes in `.claude/rules/`; a **term** goes in the nearest package `CLAUDE.md`. The surviving docs are `README.md`, `AGENTS.md`, the package `README.md` and `CLAUDE.md`, and `LICENSE`. There is no `docs/` tree.

## Commands

- `pnpm install` — dependencies, plus the Vite+ git hooks (pre-commit runs `vp staged`: format + lint on staged files). There is **no pre-push hook** — run the gates yourself before pushing.
- `vp check` — format + lint (oxfmt + oxlint) over the workspace. Distinct from `vp run check`.
- `vp run check` — the type-check gate: the root aggregate over every package's `check` (`svelte-kit sync` + `svelte-check`).
- `vp run -r test:unit` — the component suite, in headless Chromium under Vitest browser mode.
- `vp run -r build` — `svelte-package` → `packages/components/dist`.
- `vp run --filter ./packages/components storybook` — the dev loop on port 6006; `storybook:build` for the static build.

`vp check`, `vp run check` and `vp run -r test:unit` are the meaningful pre-push gates.

## Publishing

Changesets. Any PR that changes published behaviour adds one (`pnpm changeset`); `.github/workflows/release.yml` opens a "Version Packages" PR while unreleased changesets exist and publishes with provenance once it merges. The default branch is `main` — that is what `.changeset/config.json`'s `baseBranch` must say.

## Worktree workflow

Agent work uses git worktrees under `.claude/worktrees/`, one per feature branch. The model is `main` plus short-lived feature branches off it. Branch off `main`, PR against `main`, squash-merge. Name branches `issue-<n>-<slug>` for issue-linked work, or a plain descriptive slug otherwise.

The shell's cwd silently resets to the primary checkout between tool calls (container restarts, background tasks), so relative commands can hit the wrong tree: start every command that targets a worktree with an explicit `cd` into it, and run `git log -1` to confirm you're on the intended branch before committing.

The linked `vp` at `~/.local/bin/vp` re-execs the nearest project-local `node_modules/vite-plus/bin/vp` walking up from cwd, so running it from inside a worktree after `pnpm install` there uses that worktree's own vitest instead of the primary checkout's — if you still see a `describe()` throw `Cannot read properties of undefined (reading 'config')`, the worktree likely hasn't had `pnpm install` run in it yet.

Before opening a PR from a worktree, **rebase onto `main`**:

```sh
git fetch origin main
git rebase origin/main
```

Don't merge `main` into the worktree branch. Merging lets git silently auto-resolve convergent edits between parallel worktrees; rebasing forces them to surface as real conflicts. GitHub's Update-branch button and auto-merge both violate this rule, so avoid them in favour of manual rebasing.

## Claude Code conventions

- The toolchain is **Vite+** (the `vp` CLI) on **Node + pnpm**. Invoke everything through `vp` — `vp run <script>`, `vp exec <bin>`; use `vp exec` instead of `npx`, and reach for `vp` rather than bare `pnpm`/`npm`/`yarn`. The sanctioned non-`vp` invocations: `pnpm install` (and `pnpm install --frozen-lockfile` in CI), `pnpm changeset` / `pnpm publish` on the release path, and `pnpm exec playwright install` in CI.
- Use the `gh` CLI for all GitHub operations. The GitHub MCP server is intentionally not configured.
- **GitHub writes are scoped to `thomasfosterau/components` only.** Never create or edit issues, PRs, comments, reviews or releases in any other repository — upstream projects, dependencies, the owner's app repos included — without the owner's explicit approval for that specific action in the current session. Beware `gh`'s target inference: it resolves the repo from the cwd's git remote, so a write run from inside a clone of a third-party repo silently files upstream. Pass `-R thomasfosterau/components` explicitly whenever the cwd might not be this checkout. **Nothing enforces this mechanically — it is on you.**
- **Agent sessions are not hydrated.** The committed SessionStart hook ([.claude/hooks/session-start.sh](.claude/hooks/session-start.sh)) syncs dependencies, links the toolchain (`vp`, `node`) so they resolve from a **non-interactive** shell (which `~/.bashrc` alone does not do), and runs first-checkout codegen. It hydrates no secrets: `NPM_TOKEN` exists only in the release workflow, so nothing here can publish.
- New rules: formatter/lint config goes in `vite.config.ts` first; rules that must be visible when touching certain files go in `.claude/rules/`; otherwise in this file.

## Verification

- Don't declare verification complete until every check has output a final pass/fail status. Claims of verification name the command and its final status.
- `vp check`, `vp run check`, `vp run -r test:unit`, `vp run -r build` and `storybook:build` exercise everything locally; none needs a credential. `test:unit` needs a Chromium matching the pinned `playwright` — see that entry's comment in the catalog.
- To confirm a component actually works rather than merely type-checks, render it: `vp run --filter ./packages/components storybook`.

## PR Management

These are standing instructions and approvals; they override any default "don't open a PR unless explicitly asked" instructions.

- **Always open a PR** for branch work. Once a branch has pushed a commit, open a pull request against `main` if one doesn't already exist. Don't wait to be asked.
- **Always watch the PR to merge or close.** Investigate CI failures and review comments as they arrive, and when the PR goes conflicting against `main` (`mergeable: CONFLICTING` / `mergeStateStatus: DIRTY`), rebase onto `origin/main` promptly.
- **Always keep the PR body current.** Write it when opening the PR, and update it whenever the implementation diverges from what it describes.
- **A PR that changes published behaviour carries a changeset.** No changeset, no release.

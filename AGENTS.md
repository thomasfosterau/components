# AGENTS.md

`CLAUDE.md` is a symlink to this file. This repo publishes two Svelte 5 component libraries; the artifacts that matter are `packages/components/dist` and `packages/maps/dist`, and everything below exists to keep them small, typed and accessible. The toolchain, workspace shape, catalog discipline and session hook are copied from the app repos so a component authored here compiles identically in the app that consumes it; the places the two deliberately differ are commented where they occur (the browser-mode test suite and its `playwright` provider, the absence of a stage/deploy graph).

| Package | Directory | Boundary |
| --- | --- | --- |
| `@thomasfosterau/components` | `packages/components` | The core library. Peers: `svelte`; optional `@thomasfosterau/effect-forms-svelte`, reached only from `/entity-form`. Rules in [its CLAUDE.md](packages/components/CLAUDE.md). |
| `@thomasfosterau/components-mapbox` | `packages/maps` | Maps and the plan editor. Required peer `mapbox-gl`; consumes the core through its published `/canvas` entry. Rules in [its CLAUDE.md](packages/maps/CLAUDE.md). |

## Common pitfalls

- **Never edit a version in a `package.json`.** Every external version lives in [`pnpm-workspace.yaml`](pnpm-workspace.yaml) under `catalog:`, and the published peer ranges under `catalogs.peers`; package.json files carry only `catalog:`, `catalog:peers` or `workspace:*`. `catalogMode: strict` governs only the commands that write a specifier: `pnpm add` writes `catalog:` (creating the catalog entry if there is none), and `pnpm add` or `pnpm update <pkg>@<range>` fails with `ERR_PNPM_CATALOG_VERSION_MISMATCH` on a version outside the catalog's range; `pnpm install` accepts a literal hand-edited into a package.json, so review is what keeps literals out. After editing the catalog, run `pnpm install` and commit the regenerated `pnpm-lock.yaml` — a stale lockfile fails every CI job at once with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.
- **`dist/` is the product; `src/routes` does not exist.** Both packages are `svelte-package` libraries, not SvelteKit apps: no demo app, no adapter, no `app.html`. Nothing under either `src/lib/` may import `$app/*`, `$env/*` or anything else SvelteKit only resolves inside an app; an Oxlint `no-restricted-imports` override in the root `vite.config.ts` enforces it, since the `$app/types` the package tsconfigs take from `$app/tsconfig` declares `$app/*` and `svelte-check` no longer rejects such an import. SvelteKit is here to run `svelte-kit sync` and `svelte-package`, nothing more. Each package `tsconfig.json` extends the `node_modules/$app/tsconfig.json` that `sync` writes, so every task that reads one depends on `sync`.
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
  <span {...rest} class={['sr-only', className]}>{@render children()}</span>
  ```

  Svelte 5's class arrays (`class={[…]}`) merge natively (clsx semantics, no dependency) — there is no `clsx` in this workspace, and a `.svelte` file never needs one. The caller's `class` goes **last**, so Tailwind's later-wins ordering lets them override anything. A component that swallows `id`, `aria-*` or `data-*` is a bug — a consumer cannot label, test or hook into it.

- **Every string is a prop with an English default.** There is no message catalogue and the context carries no copy: `dismissLabel = 'Dismiss'`, `previousLabel = 'Previous'`. Accessible-name props end in `Label`. An i18n app passes its own messages at the call site.
- **Links and locale go through the context.** `getComponentsContext()` supplies `href(path)`, `navigate(url)`, `isCurrent(href)` and `locale()`; a component never imports `$app/*` and never reads `window.location` itself. Every `Intl` formatter takes a `locales` prop and falls back to `locale()`.
- **No Effect outside `/entity-form`.** Async callbacks are `(…, signal: AbortSignal) => Promise<T>`; optional values are `T | undefined`. Effect adapters live in the consuming apps. The one exception is the `@thomasfosterau/components/entity-form` entry: it renders `@thomasfosterau/effect-forms-svelte` definitions, so that library, and `effect` through it, is an optional peer reached only from that entry (see [§ Effect](#effect)).
- **Ids are minted with `$props.id()`** and overridable by an `id` prop.
- **Optional props are declared `T | undefined`, never bare `prop?: T`.** The workspace compiles with `exactOptionalPropertyTypes`, under which `prop?: T` rejects an explicitly forwarded `undefined`, so `<Button {tone}>` from a caller whose own `tone` is optional would not compile. Parenthesise function types: `onSelect?: (() => void) | undefined`. The same holds for every optional property of an exported `.ts` type: `readonly year?: number | undefined`.
- **Document every component and prop for the hover.** Open each component with a one-sentence `<!-- @component … -->` comment (svelte2tsx copies only a comment starting with `@component` into the `.d.ts`; a plain `<!-- … -->` header stays maintainer-only). Give every prop a `/** … */` line, with `@defaultValue` wherever the destructuring sets one.
- **`.svelte` files are formatted by hand** — oxfmt skips them, `vp staged` only lints them and the PostToolUse format hook ignores them: two-space indent, single quotes, semicolons.
- **In a `.ts` test, `render(Component, props)` cannot take a prop named `anchor`, `target`, `props`, `events`, `context` or `intro`** — those are Svelte's mount options; nest such props under `props:`.
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
- **Every component ships with a story and a browser test.** One `*.stories.svelte` / `*.stories.ts` per component under `src/stories/<family>/` and one `tests/<family>/<Component>.test.ts`, both mirroring `src/lib/<family>/` (in `packages/maps`, which is one family, the `<family>/` level is dropped) — not beside the component, because `svelte-package` copies every `src/lib/` file into `dist/` and stories must not ship. Snippet-taking components use Svelte CSF (`defineMeta` + `<Story>`), prop-only ones plain CSF.
- **Families, entry points, and when a family becomes a package.** Core families (`ui`, `feedback`, `layout`, `fields`, `forms`, `data`, `infobox`, `formatting`, `links`, `media`, `hotkeys`, `search`) are re-exported from `@thomasfosterau/components`' root barrel; `citations`, `canvas`, `charts`, `tips` and `seo` are separate `exports` entries (`@thomasfosterau/components/<family>`), as is `entity-form` (the `forms` family's `EntityForm`, kept out of the barrel because of its optional peer) so a consumer that never uses them never loads them. `hotkeys` is also its own entry (`/hotkeys`) while staying in the barrel, so a consumer can load `HotkeyHelpDialog` lazily. A new family gets a barrel, an `exports` entry if heavy, and a README section.

  **A component whose behaviour needs a specific third-party dependency lives in its own package adjacent to `packages/components`, so the core stays free of it** — the dependency becomes that package's required peer, and installing the package is the decision to take it on. `maps` is the worked example: `@thomasfosterau/components-mapbox`, `mapbox-gl` required. An "optional peer" of the core library is the shape this rule replaces; nothing in this workspace could check it. `canvas`, `charts`, `citations` and `tips` need no such dependency and stay where they are.

- **Prefer vertical slices per component** over horizontal sweeps: component → barrel export → story → test → README row, finished, before starting the next.

## Commands

Invoke everything through `vp` — `vp run <script>`, `vp exec <bin>` (instead of `npx`). The sanctioned non-`vp` invocations: `pnpm install` (`pnpm install --frozen-lockfile` in CI), `pnpm changeset`, the release path (`pnpm run release`: `pnpm pack` + `npm publish`), and `pnpm exec playwright install` (in CI, and in a session whose image lacks the pinned Chromium revision).

- `pnpm install` — dependencies, plus the Vite+ git hooks (pre-commit runs `vp staged`: format + lint on staged files). There is no pre-push hook.
- `vp check` — format + lint (Oxfmt + Oxlint). `vp run check` — the type gate: every package's `check` (`svelte-kit sync` + `svelte-check`). They are different commands.
- `vp run -r test:unit` — both packages' suites, in headless Chromium under Vitest browser mode.
- `vp run -r build` — `svelte-package` → `packages/components/dist` and `packages/maps/dist`.
- `vp run --filter ./packages/components storybook:build` — the static Storybook build. `storybook` is the dev server on port 6006 (a long-running process; one Storybook for the workspace, see [packages/components/CLAUDE.md](packages/components/CLAUDE.md#storybook)).
- `pnpm changeset` — add a changeset.

## Verification

Before you report work as done, run the gates below in order — the same steps as `.github/workflows/ci.yml` — and quote each command with its final pass/fail. If a gate can't run here, say which and why in the PR body; never imply it ran.

1. `vp check`
2. `vp run check`
3. `vp run -r test:unit`
4. `vp run -r build`
5. `vp run --filter ./packages/components storybook:build`

None needs a credential. `test:unit` and `storybook:build` need the exact Chromium revision the pinned `playwright` expects (see that entry's comment in `pnpm-workspace.yaml`). CI installs its own; a session image's pre-installed browser is not kept in step with the pin. If the suite reports a missing executable, run `pnpm exec playwright install chromium` once and re-run the gate; if that can't run, report the browser gates as not run rather than as passing. A human confirms rendering in Storybook (the `storybook` dev server); in a session, `storybook:build` is the check.

## Branches and pull requests

- **Branches.** Branch off `trunk`; PR against `trunk`; squash-merge. Name branches `issue-<n>-<slug>` for issue-linked work, or a plain descriptive slug otherwise. Rebase onto `origin/trunk` before opening or updating a PR (`git fetch origin trunk && git rebase origin/trunk`); never merge `trunk` into your branch — merging lets git silently auto-resolve convergent edits between parallel branches, and GitHub's Update-branch button and auto-merge both merge.
- **Worktrees.** Agent work uses git worktrees under `.claude/worktrees/`, one per branch. The shell's cwd silently resets to the primary checkout between tool calls, so start every command that targets a worktree with an explicit `cd` into it and run `git log -1` before committing. The linked `vp` at `~/.local/bin/vp` re-execs the nearest project-local `node_modules/vite-plus/bin/vp`, so run `pnpm install` in a new worktree first — otherwise a `describe()` throws `Cannot read properties of undefined (reading 'config')`.
- **Changesets.** Every change to a published package's behaviour carries a changeset (`pnpm changeset`); CI- and tooling-only changes need none. Changes to doc comments that reach the emitted `.d.ts` (TSDoc, `@component`) take a `patch` changeset; other docs-only changes (READMEs, guidance) need none. Never publish or version by hand: the Release workflow opens a "chore: version packages" PR (the Version Packages PR) and the owner merges it. `.changeset/config.json`'s `baseBranch` must say `trunk`.
- **Publishing.** Publishing is npm trusted publishing (OIDC) from the protected `release` environment; there is no `NPM_TOKEN`. The publish step is [`scripts/publish.mjs`](scripts/publish.mjs) (`pnpm pack` + `npm publish <tarball>`); its header says why it is kept. The one-time owner setup is in [README.md](README.md#releasing).
- **Standing PR approvals** (these override any default "don't open a PR unless asked"): once a branch has pushed a commit, open a PR against `trunk` if none exists; watch it to merge or close, investigating CI failures and review comments as they arrive and rebasing onto `origin/trunk` promptly when it goes conflicting (`mergeable: CONFLICTING`); keep the PR body current as the implementation diverges.
- **GitHub scope.** GitHub writes go to `thomasfosterau/components` only; pass `-R thomasfosterau/components` whenever the cwd might be another checkout — `gh` resolves the repo from the cwd's git remote, so a write from a third-party clone silently files upstream. Writing anywhere else (upstream projects, the owner's app repos) needs the owner's explicit approval for that action in the current session. Use the `gh` CLI for GitHub operations, even when GitHub MCP tools are available.

## Work tracker

Issues in `thomasfosterau/components` are the backlog: when you find work you can't do now, file an issue rather than leaving a TODO. The issue is the spec — read its comments (`gh issue view <n> --comments -R thomasfosterau/components`); later comments override the body. Record decisions and findings as issue comments. Stop-and-report is a valid outcome: on a blocker outside the issue's scope, comment the evidence on the issue and stop. Scope cut mid-PR becomes a linked issue before merge.

## Effect

Only `forms/EntityForm.svelte` and `forms/entity-form.ts` touch Effect (see [packages/components/CLAUDE.md](packages/components/CLAUDE.md#boundary)). The version is the `effect` pin in `pnpm-workspace.yaml`. effect-solutions is not provisioned in this repo; before writing Effect code there, read `node_modules/effect/dist/*.d.ts` and `@thomasfosterau/effect-forms-svelte`'s README rather than guessing at an API.

## Agent sessions

The SessionStart hook ([`.claude/hooks/session-start.sh`](.claude/hooks/session-start.sh)) installs dependencies against the lockfile, links `vp` and `node` so they resolve from a non-interactive shell, and runs first-checkout codegen. It hydrates no secrets, and there are none to hydrate: publishing needs an OIDC token only the release workflow's `release` environment can mint, so nothing here can publish. A PostToolUse hook runs `vp fmt --write` on every edited non-Svelte file. Don't start the `storybook` dev server in a session; use `storybook:build`.

## Documentation surfaces

One home per fact:

- **`AGENTS.md`** (this file) — repo-wide rules, commands and the gate list.
- **Package `CLAUDE.md`** — that package's boundary, invariants and terms.
- **Package `README.md`** — the API reference consumers read on npm. The root `README.md` is the landing page, the contributor setup and the release pipeline with its owner setup.
- **Issue comments** — decisions and findings, later comments overriding the body.
- **`.claude/rules/`** — a rule that must be visible when touching certain files (none exist yet). Formatter and lint config goes in `vite.config.ts` first.

There is no `docs/` tree.

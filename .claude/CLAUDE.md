# Claude Code in this repository

Only what is specific to Claude Code lives here: its hooks, and the constraints of a Claude session. Everything that applies to any agent or contributor is imported below from the files that own it (one home per fact, AGENTS.md § Documentation surfaces), so nothing here repeats them. Claude Code loads this file as project memory from `.claude/CLAUDE.md`; there is no root `CLAUDE.md`. Each package's `CLAUDE.md` is just `@AGENTS.md`, loaded when you work in that package.

## Hooks (`.claude/settings.json`)

The SessionStart hook ([`.claude/hooks/session-start.sh`](hooks/session-start.sh)) installs the global Vite+ CLI at the catalog's `vite-plus` pin with the official installer (npm-provenance and SHA-512 checked; it needs `vite.plus` and `viteplus.dev` on the environment's allowlist), links `vp` and `vpx` into `~/.local/bin` (the CLI lives under `$VP_HOME` when set, as in the Vite+ container image, else `~/.local/share/vite-plus`) so they resolve from a non-interactive shell, runs `vp install --frozen-lockfile` (which re-applies the `effect-tsgo` patch), repairs a broken bare `node`, and runs first-checkout codegen. Everything else goes through Vite+: `vp exec fallow …` for fallow, `vpx <file>.ts` for scripts; nothing else is put on PATH. If the installer can't run, `vp` falls back to this checkout's `node_modules` copy. It hydrates no secrets, and there are none to hydrate: publishing needs an OIDC token only the release workflow's `release` environment can mint, so nothing here can publish. A PostToolUse hook runs `vp fmt --write` on every edited non-Svelte file, and a PreToolUse hook ([`.claude/hooks/fallow-gate.sh`](hooks/fallow-gate.sh)) runs `fallow audit` through `vp exec fallow` before every `git commit` / `git push` (§ Fallow local gate), in this checkout and its `.claude/worktrees/*` only: for a commit in any other tree it runs none of that tree's tooling and skips the audit with a notice. Don't start the `storybook` dev server in a session; use `storybook:build`.

No plugins are configured in `.claude/settings.json`, and there are no `.claude/rules/` yet.

## Session constraints

- **Worktrees.** Agent work uses git worktrees under `.claude/worktrees/`, one per branch. The shell's cwd silently resets to the primary checkout between tool calls, so start every command that targets a worktree with an explicit `cd` into it and run `git log -1` before committing. The global `vp` delegates to the checkout's own `node_modules/vite-plus`, so run `vp install` in a new worktree first — otherwise it runs no project-local toolchain there, and a `describe()` can throw `Cannot read properties of undefined (reading 'config')`.
- **Browsers.** The browser suites (`test:unit` for the Svelte packages) need the exact Chromium revision the pinned `playwright` expects; a session image's pre-installed browser is not kept in step with it. Follow AGENTS.md § Verification: try `pnpm exec playwright install chromium` once, and if the session's network policy refuses `cdn.playwright.dev`, report the browser gates as not run. A run against another revision is evidence, not the gate.
- **No Swift.** No session has a Swift toolchain, so `packages/charts/swift/ChartSpecKit` is tested only by its own workflow; say so rather than claim it ran.
- **Never `git stash`.** The stash stack is shared by the main checkout and every worktree; set work aside with a WIP commit instead.

## Fallow and this file

`fallow hooks install` / `fallow agent install` regenerate their blocks in the root `AGENTS.md` (§ Fallow local gate and § Fallow task map), which is where they belong. Don't let fallow append an `@AGENTS.md` line to a `CLAUDE.md`: this file already imports AGENTS.md below, and a second import would load it twice.

## Imported

@../AGENTS.md

@../CONTRIBUTING.md

@../README.md

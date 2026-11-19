# Claude Code

Read README.md, docs/CONTRIBUTING.md and AGENTS.md (imported below). This file holds only what is specific to Claude Code.

- `.claude/settings.json` runs `fallow audit --base origin/trunk` before `git commit` / `git push` (blocking on a `fail` verdict) and `vp fmt` on every edited file except `.svelte`.
- Work in git worktrees under `.claude/worktrees/`, one per branch, and run `vp install` in each. The shell's cwd resets between tool calls, so `cd` into the worktree in every command.

@../README.md @../docs/CONTRIBUTING.md @../AGENTS.md

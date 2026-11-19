# Claude Code

Read README.md, docs/CONTRIBUTING.md and AGENTS.md (imported below). This file holds only what is specific to Claude Code.

- `.claude/settings.json` runs `vp fmt` on every edited file except `.svelte`. The fallow audit is a git hook (see docs/CONTRIBUTING.md), not a Claude hook.
- Work in git worktrees under `.claude/worktrees/`, one per branch, and run `vp install` in each. The shell's cwd resets between tool calls, so `cd` into the worktree in every command.

@../README.md @../docs/CONTRIBUTING.md @../AGENTS.md

# @thomasfosterau/components

A collection of Svelte 5 components built on Tailwind, DaisyUI and Bits UI, which I use in my own apps (mostly private repos). Open sourced here to share them, get more GitHub Actions minutes, and keep them in sync across various projects.

**Disclaimer:** These components (and therefore this repository) have been extracted from several private repositories using Claude Code. Most of the components I wrote myself, but aren't particularly original. Claude has generalised the API in many cases.

| Package | Description |
| --- | --- |
| [`@thomasfosterau/components`](./packages/components) | Accessible Svelte 5 UI primitives — Tailwind CSS 4 and daisyUI 5 for styling, bits-ui for interaction, every string a prop |
| [`@thomasfosterau/components-mapbox`](./packages/maps) | Mapbox GL maps and a plan editor for `@thomasfosterau/components` — a static raster, the interactive surface, and the GeoJSON seam |
| [`@thomasfosterau/charts`](./packages/charts) | A portable, renderer-agnostic chart spec and its JSON Schema, a pure TypeScript geometry core, and React, Vue, ProseMirror and Vega-Lite interpreters (plus the Swift `ChartSpecKit`). Not Svelte; merged in from the former `thomasfosterau/charts` repo |

This is a publishable-library workspace, not an application: the build artifacts are `packages/components/dist`, `packages/maps/dist` and `packages/charts/dist`. The component reference — installation, app integration, and every family's props table — lives in [`packages/components/README.md`](./packages/components/README.md) and [`packages/maps/README.md`](./packages/maps/README.md); the chart spec, its entries and capability matrix in [`packages/charts/README.md`](./packages/charts/README.md). This file covers the workspace itself.

## Development

The toolchain is **Vite+** (the `vp` CLI) on **Node + pnpm**. Everything except `pnpm install`, `pnpm changeset` and the release path goes through `vp` (`vp run <task>`, `vp exec <bin>`).

```sh
pnpm install                                        # dependencies + the Vite+ git hooks
vp check                                            # format + lint (oxfmt + oxlint)
vp run check                                        # the type-check gate (svelte-check; tsc for charts)
vp run -r test:unit                                 # every suite: headless Chromium for the Svelte packages, Node for charts
vp run -r build                                     # svelte-package / vp pack -> packages/{components,maps,charts}/dist
vp run --filter ./packages/components storybook     # the dev loop, port 6006 — one Storybook, both packages' stories
vp run --filter ./packages/components storybook:build
```

The pre-push gates, in CI's order, are listed in [AGENTS.md § Verification](./AGENTS.md#verification). There is no pre-push hook; the pre-commit hook runs `vp staged` (format + lint on staged files) only.

### Toolchain notes

- **Versions are catalogued.** Every external version lives in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) under `catalog:` (published peer ranges under `catalogs.peers`); package.json files carry only `catalog:`, `catalog:peers` or `workspace:*`. `catalogMode: strict` makes `pnpm add` write `catalog:` (adding the catalog entry if there is none) and makes `pnpm add` or `pnpm update <pkg>@<range>` refuse a version outside the catalog's range; `pnpm install` still accepts a literal edited in by hand, so review is what keeps literals out. Edit the catalog, then `pnpm install`, then commit the regenerated `pnpm-lock.yaml`.
- **The Svelte packages' tests drive a real browser** (`packages/charts`, which has no Svelte, runs under Node — see [its CLAUDE.md](./packages/charts/CLAUDE.md#testing)). Vitest browser mode over Playwright Chromium, headless everywhere. Locally that needs a Chromium matching the pinned `playwright` (`pnpm exec playwright install chromium`, or an image that pre-installs one under `PLAYWRIGHT_BROWSERS_PATH`); CI installs it in a step of its own.
- **`.svelte` files are outside oxfmt's remit** and are kept in style by hand (rule in [AGENTS.md § Conventions](./AGENTS.md#conventions)). Everything else is formatted by `vp fmt`.
- **TypeScript is the TS6 JS compiler**, aliased in the catalog: `svelte-check` drives TypeScript through its JS API, which TypeScript 7 does not ship until 7.1.

## Versioning

[Changesets](https://github.com/changesets/changesets). Add one with `pnpm changeset` in any pull request that changes published behaviour; the release workflow opens a version PR and publishes on merge. Which changes need one is in [AGENTS.md § Branches and pull requests](./AGENTS.md#branches-and-pull-requests).

## Releasing

`.github/workflows/release.yml` runs [`changesets/action`](https://github.com/changesets/action) on every push to `trunk`: while unreleased changesets exist it opens (or updates) a **"chore: version packages"** pull request; merging that pull request publishes every package whose version is not yet on npm, then tags the release and creates a GitHub release per package.

Publishing is **npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC)** from the protected `release` environment. There is no `NPM_TOKEN` secret: the job's `id-token: write` permission is exchanged by the npm CLI for a short-lived publish credential. That needs npm 11.5.1 or later; the job uses the npm bundled with Node `latest`, which meets it, and does not upgrade npm separately. Nothing requests provenance (an explicit request fails from a private repository). [`scripts/publish.mjs`](./scripts/publish.mjs) packs each package with `pnpm pack` (rewriting `catalog:` and `workspace:*` to real ranges) and publishes the tarball with `npm publish`, dependencies first; its header says why the script is kept now that pnpm 11 can publish through OIDC itself.

One-time owner setup:

1. **The `release` environment.** _Settings → Environments → New environment_ `release`, with _Deployment branches and tags_ restricted to `trunk`. The workflow's job runs in it, and the trusted publishers below name it.
2. **Let Actions open the version PR.** _Settings → Actions → General → Workflow permissions →_ **Allow GitHub Actions to create and approve pull requests**.
3. **A trusted publisher per package** on npmjs.com — for each of `@thomasfosterau/components`, `@thomasfosterau/components-mapbox` and `@thomasfosterau/charts`, _Settings → Trusted Publisher → GitHub Actions_: user `thomasfosterau`, repository `components`, workflow `release.yml`, environment `release`. npm only accepts a trusted publisher on a package that already exists, so if a package has never been published, bootstrap its first version once by hand (merge the version PR first so `trunk` carries the real version, then `vp run -r build` and `pnpm publish --access public` in that package's directory with a short-lived granular token), then add the trusted publisher. Remove any `NPM_TOKEN` repository secret once OIDC is in place.

## License

MIT © Thomas Foster

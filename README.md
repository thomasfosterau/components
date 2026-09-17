# @thomasfosterau/components

Accessible Svelte 5 UI primitives — [Tailwind CSS 4](https://tailwindcss.com) and [daisyUI 5](https://daisyui.com) for styling, [bits-ui](https://bits-ui.com) for interaction — in a [Vite+](https://viteplus.dev) workspace. 107 components across 17 families, consolidated out of the owner's four Svelte 5 apps into two publishable packages.

| Package | Description |
| --- | --- |
| [`@thomasfosterau/components`](./packages/components) | The published library (`svelte-package`) |
| [`@thomasfosterau/components-maps`](./packages/maps) | Mapbox GL maps and a plan editor, split out so the core library carries no mapping engine (`mapbox-gl` is its required peer) |

This is a publishable-library workspace, not an application: the build artifacts are `packages/components/dist` and `packages/maps/dist`. A component whose behaviour needs a specific third-party dependency lives in its own package adjacent to `packages/components`, so the core stays free of it — `maps` is the only one so far. The component reference — installation, app integration, and every family's props table — lives in [`packages/components/README.md`](./packages/components/README.md) and [`packages/maps/README.md`](./packages/maps/README.md). This file covers the workspace itself.

## Development

The toolchain is **Vite+** (the `vp` CLI) on **Node + pnpm**. Everything goes through `vp` — `vp install`, `vp add`, `vp run <script>`, `vp exec <bin>` — rather than bare `pnpm`/`npm`.

```sh
pnpm install                                        # dependencies + the Vite+ git hooks
vp check                                            # format + lint (oxfmt + oxlint)
vp run check                                        # the type-check gate (svelte-check)
vp run -r test:unit                                 # both suites, in headless Chromium under Vitest browser mode
vp run -r build                                     # svelte-package -> packages/{components,maps}/dist
vp run --filter ./packages/components storybook     # the dev loop, port 6006 — one Storybook, both packages' stories
vp run --filter ./packages/components storybook:build
```

`vp check`, `vp run check` and `vp run -r test:unit` are the meaningful pre-push gates. There is no pre-push hook; the pre-commit hook runs `vp staged` (format + lint on staged files) only.

### Toolchain notes

- **Versions are catalogued.** Every external version lives in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) under `catalog:`; package.json files carry only `catalog:` or `workspace:*`, and `catalogMode: strict` enforces it. Edit the catalog, then `pnpm install`, then commit the regenerated `pnpm-lock.yaml`.
- **The tests drive a real browser.** Vitest browser mode over Playwright Chromium, headless everywhere. Locally that needs a Chromium matching the pinned `playwright` (`pnpm exec playwright install chromium`, or an image that pre-installs one under `PLAYWRIGHT_BROWSERS_PATH`); CI installs it in a step of its own.
- **`.svelte` files are outside oxfmt's remit** and are kept in the same style by hand — two-space indent, single quotes. Everything else is formatted by `vp fmt`.
- **TypeScript is the TS6 JS compiler**, aliased in the catalog: `svelte-check` drives TypeScript through its JS API, which TypeScript 7 does not ship until 7.1.

## Versioning

[Changesets](https://github.com/changesets/changesets). Add one with `pnpm changeset` in any pull request that changes published behaviour; the release workflow opens a version PR and publishes on merge.

## License

MIT © Thomas Foster

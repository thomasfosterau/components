# @thomasfosterau/components

Accessible Svelte 5 UI primitives — [Tailwind CSS 4](https://tailwindcss.com) and [daisyUI 5](https://daisyui.com) for styling, [bits-ui](https://bits-ui.com) for interaction — in a [Vite+](https://viteplus.dev) workspace.

| Package                                               | Description                              |
| ----------------------------------------------------- | ---------------------------------------- |
| [`@thomasfosterau/components`](./packages/components) | The published library (`svelte-package`) |

The component reference lives in [`packages/components`](./packages/components). This file covers the workspace.

## Development

The toolchain is **Vite+** (the `vp` CLI) on **Node + pnpm**. Everything goes through `vp` — `vp install`, `vp add`, `vp run <script>`, `vp exec <bin>` — rather than bare `pnpm`/`npm`.

```sh
pnpm install                                        # dependencies + the Vite+ git hooks
vp check                                            # format + lint (oxfmt + oxlint)
vp run check                                        # the type-check gate (svelte-check)
vp run -r test:unit                                 # the component suite, in real Chromium
vp run -r build                                     # svelte-package -> packages/components/dist
vp run --filter ./packages/components storybook     # the dev loop, port 6006
vp run --filter ./packages/components storybook:build
```

`vp check` and `vp run check` and `vp run -r test:unit` are the meaningful pre-push gates. There is no pre-push hook; the pre-commit hook runs `vp staged` (format + lint on staged files) only.

### Toolchain notes

- **Versions are catalogued.** Every external version lives in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) under `catalog:`; package.json files carry only `catalog:` or `workspace:*`, and `catalogMode: strict` enforces it. Edit the catalog, then `pnpm install`, then commit the regenerated `pnpm-lock.yaml`.
- **The tests drive a real browser.** Vitest browser mode over Playwright Chromium, headless everywhere. Locally that needs a Chromium matching the pinned `playwright` (`pnpm exec playwright install chromium`, or an image that pre-installs one under `PLAYWRIGHT_BROWSERS_PATH`); CI installs it in a step of its own.
- **`.svelte` files are outside oxfmt's remit** and are kept in the same style by hand — two-space indent, single quotes. Everything else is formatted by `vp fmt`.
- **TypeScript is the TS6 JS compiler**, aliased in the catalog: `svelte-check` drives TypeScript through its JS API, which TypeScript 7 does not ship until 7.1.

## Versioning

[Changesets](https://github.com/changesets/changesets). Add one with `pnpm changeset` in any pull request that changes published behaviour; the release workflow opens a version PR and publishes on merge.

## License

MIT © Thomas Foster

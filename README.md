# @thomasfosterau/components

Accessible Svelte 5 components styled with Tailwind CSS 4 and built on
[Melt UI](https://next.melt-ui.com), in a [Vite+](https://viteplus.dev)
workspace.

| Package                                               | Description                                      |
| ----------------------------------------------------- | ------------------------------------------------ |
| [`@thomasfosterau/components`](./packages/components) | The component library, plus a SvelteKit demo app |

See [`packages/components`](./packages/components) for the component reference
and prop tables.

## Development

```bash
npm install          # install all workspace dependencies
npm run dev          # start the demo app (SvelteKit)
npm test             # vp test — Vitest, server-rendering the components
npm run check        # vp check, then svelte-check for the Svelte package
npm run lint         # vp lint — oxlint, type-aware
npm run fmt          # vp fmt — oxfmt, the formatter of record
npm run build        # svelte-package → packages/components/dist
npm run build:demo   # build the demo app
```

### Toolchain notes

- `packages/components` is a SvelteKit package: its types come from the
  generated `$app/tsconfig`, so `vp check` skips it and `svelte-check` type
  checks it instead.
- `.svelte` files are outside oxfmt's remit. Everything else in the workspace
  is formatted by `vp fmt`; the `.svelte` files follow the same style
  (two-space indent, single quotes) by hand.
- SvelteKit 3 has no `svelte.config.js`. Configuration lives in the
  `sveltekit()` call in `packages/components/vite.config.ts`, and `$lib` is
  replaced by the `#lib/*` subpath import declared in that package's
  `package.json`.
- TypeScript is pinned to 6.0.3 workspace-wide: SvelteKit 3 declares a
  `typescript@^6` peer, and an unpinned tree resolves 7.x and fails to install.
- Tests run in the server environment and assert on `render` from
  `svelte/server`. Covering client-side interaction would mean Vitest browser
  mode, which is what Svelte recommends over a DOM shim.

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets):

```bash
npm run changeset
```

## License

MIT © Thomas Foster

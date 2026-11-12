# @thomasfosterau/components

Accessible Svelte 5 components built on Tailwind CSS 4, daisyUI 5 and bits-ui, with a Mapbox companion package and a portable chart spec. I use them in my own apps (mostly private repositories) and publish them here to share them and keep them in sync across projects.

**Disclaimer:** these components (and therefore this repository) were extracted from several private repositories using Claude Code. I wrote most of the components myself, though they aren't particularly original; Claude generalised the API in many cases.

| Package | npm | What it is |
| --- | --- | --- |
| [`@thomasfosterau/components`](https://github.com/thomasfosterau/components/blob/trunk/packages/components/README.md) | [![npm](https://img.shields.io/npm/v/@thomasfosterau/components)](https://www.npmjs.com/package/@thomasfosterau/components) | Accessible Svelte 5 UI primitives: daisyUI classes for styling, bits-ui for interaction, every string a prop. |
| [`@thomasfosterau/components-mapbox`](https://github.com/thomasfosterau/components/blob/trunk/packages/mapbox/README.md) | [![npm](https://img.shields.io/npm/v/@thomasfosterau/components-mapbox)](https://www.npmjs.com/package/@thomasfosterau/components-mapbox) | Mapbox GL maps and a plan editor for the components. `mapbox-gl` is a required peer. |
| [`@thomasfosterau/charts`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/README.md) | [![npm](https://img.shields.io/npm/v/@thomasfosterau/charts)](https://www.npmjs.com/package/@thomasfosterau/charts) | A portable, renderer-agnostic chart spec and its JSON Schema, with Svelte, ProseMirror and Vega-Lite interpreters. |

The guides are in [`docs/`](https://github.com/thomasfosterau/components/blob/trunk/docs).

## Contributing

The toolchain is [Vite+](https://viteplus.dev) on Node and pnpm. Setup, hooks and the individual checks are in [CONTRIBUTING.md](./CONTRIBUTING.md); the conventions and the gate list every change passes are in [AGENTS.md](./AGENTS.md). Releases are Changesets with npm trusted publishing: see [PUBLISHING.md](./PUBLISHING.md). Report vulnerabilities as [SECURITY.md](./SECURITY.md) describes.

## License

MIT © Thomas Foster

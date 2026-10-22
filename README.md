# @thomasfosterau/components

Accessible Svelte 5 components built on Tailwind CSS 4, daisyUI 5 and bits-ui, with a Mapbox companion package and a portable chart spec. I use them in my own apps (mostly private repositories) and publish them here to share them and keep them in sync across projects.

**Disclaimer:** these components (and therefore this repository) were extracted from several private repositories using Claude Code. I wrote most of the components myself, though they aren't particularly original; Claude generalised the API in many cases.

| Package | npm | What it is |
| --- | --- | --- |
| [`@thomasfosterau/components`](./packages/components) | [![npm](https://img.shields.io/npm/v/@thomasfosterau/components)](https://www.npmjs.com/package/@thomasfosterau/components) | Accessible Svelte 5 UI primitives: daisyUI classes for styling, bits-ui for interaction, every string a prop. The core families in one barrel; citations, canvas, charts, tips, SEO, hotkeys and the Effect-backed `EntityForm` behind their own entry points. |
| [`@thomasfosterau/components-mapbox`](./packages/mapbox) | [![npm](https://img.shields.io/npm/v/@thomasfosterau/components-mapbox)](https://www.npmjs.com/package/@thomasfosterau/components-mapbox) | Mapbox GL maps and a plan editor for `@thomasfosterau/components`: a static raster, the interactive surface, and the GeoJSON seam. `mapbox-gl` is a required peer. |
| [`@thomasfosterau/charts`](./packages/charts) | [![npm](https://img.shields.io/npm/v/@thomasfosterau/charts)](https://www.npmjs.com/package/@thomasfosterau/charts) | A portable, renderer-agnostic chart spec and its JSON Schema, a pure TypeScript geometry core, and React, Vue, Svelte, ProseMirror and Vega-Lite interpreters (plus the Swift `ChartSpecKit`). Its Svelte `Chart` reads the spec; the core library's `/charts` one takes series props. |

## Install

```sh
pnpm add @thomasfosterau/components
```

The components ship uncompiled `.svelte` files and Tailwind class names, so your app needs `svelte` 5, Tailwind CSS 4 and daisyUI 5. Point Tailwind at the package and import its themes from your CSS entry:

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
@plugin "daisyui" {
  themes: false;
}
@import '@thomasfosterau/components/theme.css';
```

## Example

```svelte
<script lang="ts">
  import { Alert, Button } from '@thomasfosterau/components';

  let saved = $state(false);
</script>

<Button onclick={() => (saved = true)}>Save</Button>
{#if saved}
  <Alert tone="success">Saved.</Alert>
{/if}
```

App integration (links, navigation, locale), every family's props and the entry points are in the [components reference](./packages/components/README.md). The maps are in the [`components-mapbox` reference](./packages/mapbox/README.md); the chart spec, its interpreters and the capability matrix in the [`charts` reference](./packages/charts/README.md).

## Contributing

The toolchain is [Vite+](https://viteplus.dev) on Node and pnpm. Setup, hooks and the individual checks are in [CONTRIBUTING.md](./CONTRIBUTING.md); the conventions and the gate list every change passes are in [AGENTS.md](./AGENTS.md). Releases are Changesets with npm trusted publishing: see [PUBLISHING.md](./PUBLISHING.md). Report vulnerabilities as [SECURITY.md](./SECURITY.md) describes.

## License

MIT © Thomas Foster

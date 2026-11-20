# components

Accessible Svelte 5 components on Tailwind CSS 4, daisyUI 5 and bits-ui, plus a Mapbox companion, a portable chart spec and a data import mapper. Extracted from Thomas Foster's own apps and published to keep them in sync.

> [!CAUTION]
> Experimental and pre-1.0: the API may change in any release. Largely written with Claude Code.

## Packages

| Package | What it is |
| --- | --- |
| [`@thomasfosterau/components`](packages/components/README.md) | Accessible UI primitives: daisyUI for styling, bits-ui for interaction, every string a prop. |
| [`@thomasfosterau/components-mapbox`](packages/mapbox/README.md) | Mapbox GL maps and a plan editor. `mapbox-gl` is a required peer. |
| [`@thomasfosterau/charts`](packages/charts/README.md) | A renderer-agnostic chart spec, its JSON Schema, and Svelte, ProseMirror and Vega-Lite interpreters. |
| [`@thomasfosterau/components-import`](packages/import/README.md) | Maps a user's table onto an app's Effect Schema, headless or through a Svelte `ImportMapper`. |

## Usage

```sh
pnpm add @thomasfosterau/components
```

```svelte
<script lang="ts">
  import { Button } from '@thomasfosterau/components';
</script>

<Button onclick={() => alert('Hi')}>Say hi</Button>
```

Tailwind and theme setup are in the [getting-started guide](packages/components/docs/getting-started.md); each package README links its guides.

## More

- [Contributing](docs/CONTRIBUTING.md), [publishing](docs/PUBLISHING.md), [security](docs/SECURITY.md)
- [MIT licence](LICENSE.md)

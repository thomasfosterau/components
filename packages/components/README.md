# @thomasfosterau/components

Accessible Svelte 5 UI primitives, styled with [Tailwind CSS 4](https://tailwindcss.com) and [daisyUI 5](https://daisyui.com) and built on [bits-ui](https://bits-ui.com). Semantic daisyUI classes only, bits-ui for anything interactive, and every user-facing string a prop with an English default. Components ship as uncompiled `.svelte` files, so your build compiles them.

## Install

```sh
pnpm add @thomasfosterau/components
```

You need `svelte` 5, Tailwind CSS 4 and daisyUI 5. Point Tailwind at the package and import its themes from your CSS entry:

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
@plugin "daisyui" {
  themes: false;
}
@import '@thomasfosterau/components/theme.css';
```

Links, navigation and locale come from a small context rather than `$app/*`; set it once in your root layout (every member is optional):

```svelte
<script lang="ts">
  import { setComponentsContext } from '@thomasfosterau/components';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  setComponentsContext({ navigate: goto, isCurrent: (href) => page.url.pathname === href });
</script>
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

Every component's props, defaults and accessibility contract are in its doc comments, so they show on hover in your editor.

## Entry points

| Import | What it holds | Guide |
| --- | --- | --- |
| `@thomasfosterau/components` | The core barrel: `ui`, `layout`, `feedback`, `fields`, `forms`, `data`, `infobox`, `formatting`, `links`, `media`, `hotkeys` and `search`. | [Getting started](https://github.com/thomasfosterau/components/blob/trunk/docs/components-getting-started.md), [ui](https://github.com/thomasfosterau/components/blob/trunk/docs/components-ui.md), [layout](https://github.com/thomasfosterau/components/blob/trunk/docs/components-layout.md), [feedback](https://github.com/thomasfosterau/components/blob/trunk/docs/components-feedback.md), [fields and forms](https://github.com/thomasfosterau/components/blob/trunk/docs/components-fields.md), [data](https://github.com/thomasfosterau/components/blob/trunk/docs/components-data.md), [content](https://github.com/thomasfosterau/components/blob/trunk/docs/components-content.md) |
| `@thomasfosterau/components/dates` | Calendar and segmented date and time controls (`Calendar`, `DateField`, `DatePicker`, ...), kept out of the barrel. | [Fields and forms](https://github.com/thomasfosterau/components/blob/trunk/docs/components-fields.md) |
| `@thomasfosterau/components/hotkeys` | The hotkey registry and help dialog, also in the barrel so `HotkeyHelpDialog` can load lazily. `CommandPalette` is in the barrel. | [Hotkeys](https://github.com/thomasfosterau/components/blob/trunk/docs/components-hotkeys.md) |
| `@thomasfosterau/components/context-menu` | `ContextMenu`, kept out of the barrel so bits-ui's menu runtime loads only where used. | [ui](https://github.com/thomasfosterau/components/blob/trunk/docs/components-ui.md) |
| `@thomasfosterau/components/citations` | `Citation`, `Footnote`, reference lists and the CSL-type renderers. | [Citations](https://github.com/thomasfosterau/components/blob/trunk/docs/components-citations.md) |
| `@thomasfosterau/components/canvas` | `VectorCanvas`, pan and zoom, undo and redo, geometry. | [Canvas](https://github.com/thomasfosterau/components/blob/trunk/docs/components-canvas.md) |
| `@thomasfosterau/components/charts` | `Chart`: line, area and bar in plain SVG. | [Charts](https://github.com/thomasfosterau/components/blob/trunk/docs/components-charts.md) |
| `@thomasfosterau/components/tips` | `Tip`, `PopoverTip` and their store. | [Tips](https://github.com/thomasfosterau/components/blob/trunk/docs/components-tips.md) |
| `@thomasfosterau/components/seo` | `Head`, `JsonLd` and the share-card URL builder. | [SEO](https://github.com/thomasfosterau/components/blob/trunk/docs/components-seo.md) |
| `@thomasfosterau/components/entity-form` | `EntityForm`, which needs the optional peers `@thomasfosterau/effect-forms-svelte` and `effect`. | [EntityForm](https://github.com/thomasfosterau/components/blob/trunk/docs/components-entity-form.md) |
| `@thomasfosterau/components/theme.css` | The `light` and `dark` daisyUI themes, on neutral values. | [Getting started](https://github.com/thomasfosterau/components/blob/trunk/docs/components-getting-started.md) |

## Links

- [Guides](https://github.com/thomasfosterau/components/blob/trunk/docs)
- [Maps: `@thomasfosterau/components-mapbox`](https://github.com/thomasfosterau/components/blob/trunk/packages/mapbox/README.md)
- [Chart spec: `@thomasfosterau/charts`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/README.md)
- [Source and issues](https://github.com/thomasfosterau/components)

## License

MIT © Thomas Foster

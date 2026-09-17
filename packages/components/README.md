# @thomasfosterau/components

Accessible Svelte 5 UI primitives, styled with [Tailwind CSS 4](https://tailwindcss.com) + [daisyUI 5](https://daisyui.com) and built on [bits-ui](https://bits-ui.com).

- **Svelte 5 only** — runes and snippets, no legacy APIs.
- **Accessible by contract** — bits-ui owns focus, keyboard and ARIA for anything interactive; every component's accessible name and role is covered by a browser test.
- **Yours to restyle** — daisyUI semantic classes over tokens you can replace wholesale.
- **Tree-shakeable** — `sideEffects: false`, one `svelte-package` artifact, nothing heavy on the always-loaded path.

## Installation

```sh
pnpm add @thomasfosterau/components
```

### Peer requirements

| Package | Range | Why |
| --- | --- | --- |
| `svelte` | `^5.30.1` | A declared peer. The components are compiled by your build, not pre-compiled. |
| `tailwindcss` | `^4.0.0` | Not a declared peer, but **required**: the components emit Tailwind classes and ship none. |
| `daisyui` | `^5.0.0` | Same — the class vocabulary is daisyUI's (`btn`, `input`, `bg-base-200`, `text-error`). |

Tailwind 4 has no `tailwind.config.js`, so wire it up from your CSS entry. Two lines matter: `@source`, which is what makes Tailwind scan this package's `dist/` and emit the classes it uses, and the `theme.css` import, which supplies the daisyUI themes the components are designed against.

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
@plugin "daisyui" {
  themes: false;
}
@import '@thomasfosterau/components/theme.css';
```

Without the `@source` line the components render unstyled — Tailwind has no way to know which classes `dist/` asks for.

### Bringing your own theme

`theme.css` declares two daisyUI themes, `light` and `dark`, on deliberately neutral values. Override them by declaring your own after the import, or drop the import entirely and declare `light` / `dark` yourself — the components only ever reach for semantic names (`bg-base-200`, `text-error`, `btn-primary`), never a raw palette class or a hex, so any pair of daisyUI themes with those names works.

## Components

```svelte
<script lang="ts">
  import { VisuallyHidden } from '@thomasfosterau/components';
</script>

<p>
  <span aria-hidden="true">★★★☆☆</span>
  <VisuallyHidden>3 out of 5 stars</VisuallyHidden>
</p>
```

**`VisuallyHidden`** — renders a `<span class="sr-only">`: present in the DOM and the accessibility tree, clipped out of the visual rendering. Takes a `children` snippet plus every native `<span>` attribute; `class` is appended after `sr-only`, so `class="focus:not-sr-only"` gives you a skip link.

The rest of the library lands on top of this one. Prop tables arrive with the components.

## Development

From the repository root, or from this directory:

```sh
vp run --filter ./packages/components sync       # svelte-kit sync (ambient types)
vp run --filter ./packages/components check      # svelte-check
vp run --filter ./packages/components test:unit  # Vitest browser mode, Chromium
vp run --filter ./packages/components build      # svelte-package -> dist/
vp run --filter ./packages/components storybook  # dev loop on :6006
```

## License

MIT

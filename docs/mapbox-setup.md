# Setting up `@thomasfosterau/components-mapbox`

The package is separate from `@thomasfosterau/components` so that an application that renders no map never installs `mapbox-gl` (about 800 kB of WebGL). Installing it is the decision to render a map.

```sh
pnpm add @thomasfosterau/components-mapbox @thomasfosterau/components mapbox-gl
```

## Peer requirements

| Package | Range | Why |
| --- | --- | --- |
| `mapbox-gl` | `^3.33.0`, **required** | The engine `DynamicMap` (and therefore `Map`) renders with. It is reached only through a dynamic `import()` inside `DynamicMap`'s mount effect, so it lands in the chunk for the route that renders a live map and nowhere else. |
| `svelte` | `^5.40.0` | A declared peer. The components are compiled by your build, not pre-compiled. |
| `@thomasfosterau/components` | the exact version released alongside it | A runtime dependency, not a peer (installed with this package): `MapEditor` is built on its `/canvas` entry point. |
| `tailwindcss` | `^4.0.0` | Not a declared peer, but **required**: the components emit Tailwind classes and ship none. |
| `daisyui` | `^5.0.0` | Same: the class vocabulary is daisyUI's (`bg-neutral`, `text-base-content`, `rounded-box`). |

## Tailwind sources

Add this package's `dist/` to Tailwind's sources alongside the core library's, or its classes are never emitted:

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
@source '../node_modules/@thomasfosterau/components-mapbox/dist';
@plugin "daisyui" {
  themes: false;
}
@import '@thomasfosterau/components/theme.css';
```

## Mapbox's stylesheet and token

`DynamicMap` imports `mapbox-gl/dist/mapbox-gl.css` for its side effect, inside the mount effect. You do not import it yourself, and it does not arrive on a page with no live map.

`StaticMap`, `DynamicMap` and `Map` take a public-scope `accessToken` prop. `MapEditor` reads no token at all, so it works on a build with no Mapbox credential.

## House rules

The same rules hold as in the core library: daisyUI semantic classes and never raw colour, every user-facing string a prop with an English default, no Effect, and the caller's `class` merged last. `StaticMap` and `DynamicMap` also spread the native attributes of the element they render; `Map`, `MapEditor` and `MapShapeView` take only their documented props.

Per-component props, snippets and ARIA are in each component's doc comment (they show on hover and in the emitted `.d.ts`).

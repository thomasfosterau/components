---
'@thomasfosterau/components': minor
---

Rebuild the component library on Svelte 5, SvelteKit 3 and Tailwind CSS 4.

- Components are written with runes (`$props`, `$state`, `$derived`) and snippets; the `svelte` peer range is now `^5.30.1`.
- The Melt UI builder stores (`@melt-ui/svelte` + `@melt-ui/pp`) are replaced by the runes-native `melt` package, so the Melt preprocessor is no longer needed.
- Tailwind CSS 4 replaces Tailwind 3 and PostCSS. Consumers no longer add this package to `tailwind.config.js`; they add `@source '../node_modules/@thomasfosterau/components/dist';` to their CSS instead. The compiled stylesheet is also published as `@thomasfosterau/components/styles.css`.
- `Dialog` now renders a native `<dialog>`, exposes `open` as a bindable prop, and takes `trigger` and `footer` snippets in place of the previously hard-coded trigger and Cancel/Confirm buttons.
- `Select` takes a bindable `value: string | undefined` in place of the `selected` item object, and exports the `SelectItem` type.
- `Tooltip` takes `placement`, `openDelay` and `closeDelay`, and renders its content inline-safely so it can sit inside a paragraph.

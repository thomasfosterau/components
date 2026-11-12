# Getting started with @thomasfosterau/components

Install, wire up Tailwind and a theme, set the components context once, and pass your own messages. The package README is the short version; this is the full setup.

## Rules that hold across every component

Four rules hold across every component:

- **daisyUI semantic classes, never raw colour.** `bg-base-200`, `text-error`, `btn-primary` — never a hex, an `oklch()` or `bg-green-700`.
- **bits-ui owns interaction.** Anything with focus management, keyboard semantics, a popover or an ARIA relationship between elements is built on a bits-ui primitive. Native elements are used where they already give the semantics (`<details>`, `<progress>`, `<time>`, `<data>`, `<dl>`).
- **Every user-facing string is a prop with an English default.** There is no message catalogue — `dismissLabel = 'Dismiss'`, `previousLabel = 'Previous'`. Accessible-name props end in `Label`. An i18n app passes its own messages at the call site.
- **No Effect outside `/entity-form`.** Async callbacks are `(…, signal: AbortSignal) => Promise<T>`; optional values are `T | undefined`. Effect adapters stay in the consuming app.

Every component spreads the native attributes of the element it renders and merges the caller's `class` last, so nothing here ever swallows an `id`, an `aria-*` attribute or a `data-*` hook.

## Install

```sh
pnpm add @thomasfosterau/components
```

### Peer requirements

| Package | Range | Why |
| --- | --- | --- |
| `svelte` | `^5.40.0` | A declared peer. The components are compiled by your build, not pre-compiled. |
| `tailwindcss` | `^4.0.0` | Not a declared peer, but **required**: the components emit Tailwind classes and ship none. |
| `daisyui` | `^5.0.0` | Same — the class vocabulary is daisyUI's (`btn`, `input`, `bg-base-200`, `text-error`). |
| `@thomasfosterau/effect-forms-svelte` | `^0.4.0` | An **optional** declared peer, needed only by the `/entity-form` entry (and bringing its own required peers, `effect` 4 and `@thomasfosterau/effect-ext` `^0.1.0 \|\| ^0.2.0`, and Node 22.18 or later). Nothing else in the package imports it. |

Tailwind 4 has no `tailwind.config.js`, so wire it up from your CSS entry. Two lines matter: `@source`, which is what makes Tailwind scan this package's `dist/` and emit the classes it uses, and the `theme.css` import (or your own themes), which supplies the daisyUI tokens the components are designed against.

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
@plugin "daisyui" {
  themes: false;
}
@import '@thomasfosterau/components/theme.css';
```

Without the `@source` line the components render unstyled — Tailwind has no way to know which classes `dist/` asks for. `themes: false` matters too: daisyUI's own built-in theme set also defines `light` and `dark`, and enabling both means two definitions of each fighting over the cascade.

### Bringing your own theme

`theme.css` declares two daisyUI themes, `light` and `dark`, on deliberately neutral values (achromatic surfaces, one slate brand hue) — a starting point, not a brand. Override them by declaring your own `@plugin "daisyui/theme"` blocks after the import, or drop the import entirely and declare `light` / `dark` yourself. The components only ever reach for semantic names, so any pair of daisyUI themes with those two names works. If you use `@thomasfosterau/components/charts`, also replace the four `--color-chart-*` custom properties with your own measured set (see [Charts](./components-charts.md)).

## App integration

Every component that needs to resolve a link, navigate, know the current page or format a locale-aware value reads from a small injected context instead of importing `$app/*` directly — that is what keeps the package usable outside SvelteKit (Storybook, a test, a plain Svelte app). Call `setComponentsContext` once, in your root layout:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { setComponentsContext } from '@thomasfosterau/components';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getLocale, localizeHref } from '$lib/paraglide/runtime';

  setComponentsContext({
    locale: getLocale,
    href: localizeHref,
    navigate: goto,
    isCurrent: (href) => page.url.pathname === href,
  });
</script>
```

| Member | Type | Used for |
| --- | --- | --- |
| `locale` | `() => string \| readonly string[] \| undefined` | The default for every component's `locales` prop (`DateTime`, `NumberFormat`, `Pagination`, …). A function, not a value, so a reactive i18n runtime is re-read on every render. |
| `href` | `(path: string) => string` | Resolving an app-relative path to the href actually rendered — base-path or locale-prefix logic lives here, once. |
| `navigate` | `(url: string) => Promise<void> \| void` | Client-side navigation (`ConfirmDialog`'s `redirectTo`, `ConfirmButton`'s `redirectTo`, `CommandPalette`'s `href` rows). |
| `isCurrent` | `(href: string) => boolean` | `aria-current="page"` decisions (`Breadcrumbs`, `Tabs` in `links` mode, `FilterBar`, `Sidebar`). |

Every member is optional in the object you pass — an omitted one falls back individually to `defaultComponentsContext` (identity `href`, `window.location.assign` for navigation, pathname equality for `isCurrent`, runtime-default locale), so every component works unwired in a story or a test. The object's type is exported as `ComponentsContext` (every member required; `setComponentsContext` takes the same members, each optional), and `getComponentsContext()` reads the merged result back for a component of your own.

**A skip link first.** Put `SkipLink` before everything else in the root layout, so it is the first Tab stop on every page, and render the page content in `Main` (whose default `id` is the link's default target):

```svelte
<SkipLink />
<Navbar>…</Navbar>
<Main>{@render children()}</Main>
```

**Passing i18n messages.** There is no message catalogue in this package — every accessible-name prop has an English default and nothing more. An app using [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (or any other i18n library) passes its own messages at the call site:

```svelte
<script lang="ts">
  import { FormActions } from '@thomasfosterau/components';
  import * as m from '$lib/paraglide/messages';
</script>

<FormActions submitLabel={m.save()} pendingLabel={m.saving()} cancelLabel={m.cancel()} />
```

**Translating `requiredLabel` once.** See [Fields and forms](./components-fields.md#translating-requiredlabel-once) for the wrapper pattern that applies the same idea to a default an app always translates.

## Entry points

The root barrel carries the core families; heavier ones are separate `exports` entries so a consumer that never uses them never loads them. The list, one line each, is in the [package README](../packages/components/README.md#entry-points).

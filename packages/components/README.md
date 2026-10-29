# @thomasfosterau/components

Accessible Svelte 5 UI primitives, styled with [Tailwind CSS 4](https://tailwindcss.com) + [daisyUI 5](https://daisyui.com) and built on [bits-ui](https://bits-ui.com). The core families are in the root barrel and the heavier ones behind their own [entry points](#entry-points). The maps components live in the sibling package [`@thomasfosterau/components-mapbox`](https://github.com/thomasfosterau/components/blob/trunk/packages/mapbox/README.md).

Four rules hold across all of them:

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
| `@thomasfosterau/effect-forms-svelte` | `^0.2.0` | An **optional** declared peer, needed only by the `/entity-form` entry (and bringing its own required peer, `effect` 4). Nothing else in the package imports it. |

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

`theme.css` declares two daisyUI themes, `light` and `dark`, on deliberately neutral values (achromatic surfaces, one slate brand hue) — a starting point, not a brand. Override them by declaring your own `@plugin "daisyui/theme"` blocks after the import, or drop the import entirely and declare `light` / `dark` yourself. The components only ever reach for semantic names, so any pair of daisyUI themes with those two names works. If you use `@thomasfosterau/components/charts`, also replace the four `--color-chart-*` custom properties with your own measured set (see [Charts § Colour, and the slot cap](#charts)).

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

**Passing i18n messages.** There is no message catalogue in this package — every accessible-name prop has an English default and nothing more. An app using [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (or any other i18n library) passes its own messages at the call site:

```svelte
<script lang="ts">
  import { FormActions } from '@thomasfosterau/components';
  import * as m from '$lib/paraglide/messages';
</script>

<FormActions submitLabel={m.save()} pendingLabel={m.saving()} cancelLabel={m.cancel()} />
```

## Entry points

Heavier families are separate `exports` entries so a consumer that never uses them never loads them:

| Entry point | Families | Notes |
| --- | --- | --- |
| `@thomasfosterau/components` | ui, layout, feedback, fields, forms, data, infobox, formatting, links, media, hotkeys, search | The core barrel — everything below in one import. |
| `@thomasfosterau/components/citations` | citations | `Citation`, `Footnote`, `ReferenceList`, `FootnoteList`, `CreditList`, `DOILink`/`ISBNLink`/`ISSNLink`, the CSL-type renderers (`BookCitation`, `ChapterCitation`, `ScholarlyArticleCitation`, `ThesisCitation`, `ReportCitation`, `Publisher`), `formatCitation`, `BibliographyManager`. |
| `@thomasfosterau/components/canvas` | canvas | `VectorCanvas` and the pan/zoom/history/geometry toolkit underneath it. |
| `@thomasfosterau/components/charts` | charts | `Chart` — one component, plain SVG, no charting dependency. |
| `@thomasfosterau/components/dates` | fields (date controls) | `Calendar`, `RangeCalendar`, `DateField`, `TimeField`, `DatePicker` and `DateRangePicker` on bits-ui, plus `parseDate`, `parseTime`, `Time` and the `DateValue` / `TimeValue` types from `@internationalized/date`. Not in the barrel: the calendar state machines and date maths load only where imported, or lazily with `import()`. |
| `@thomasfosterau/components/hotkeys` | hotkeys | The same exports the barrel re-exports, as their own entry, so `import('@thomasfosterau/components/hotkeys')` can load `HotkeyHelpDialog` lazily. |
| `@thomasfosterau/components/tips` | tips | `Tip`, `PopoverTip`, `createTipStore`, `createTipStack`. |
| `@thomasfosterau/components/context-menu` | ui | `ContextMenu` — kept out of the barrel so bits-ui's menu runtime loads only where it is used. Its children (`MenuItem`, `MenuCheckboxItem`, …) come from the barrel. |
| `@thomasfosterau/components/entity-form` | forms | `EntityForm` — needs the optional peer `@thomasfosterau/effect-forms-svelte` (see [entity-form](#entity-form)). |
| `@thomasfosterau/components/seo` | seo | `Head`, `JsonLd`, `serializeJsonLd`, `ogImageUrl` and the share-card constants. |
| `@thomasfosterau/components/theme.css` | — | The daisyUI theme skeleton (see [Install](#install)). |

---

## ui

Buttons, badges and surfaces — the family every other family builds on: `Alert` is what a form's errors surface in, `Card` is the surface a section is drawn on, `Button` is what a dialog's actions are.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Button` | The daisyUI `btn` | `tone?: Tone`, `variant?: 'solid'\|'outline'\|'soft'\|'dash'\|'ghost'\|'link'`, `size?: Size`, `loading?`, `block?`, `type='button'` + `HTMLButtonAttributes` | `icon?`, `children` | native `<button>`; `loading` is `disabled` **and** `aria-busy="true"`; spinner `aria-hidden` so the name never changes |
| `LinkButton` | Navigation that reads as an action | `href`, `tone?`, `variant?`, `size?`, `disabled?`, `block?`, `external?` + `HTMLAnchorAttributes` | `icon?`, `children` | `disabled` drops `href` and restores `role="button"` + `aria-disabled` + `tabindex="-1"`; `external` → `target="_blank"` + `rel="noreferrer"` |
| `Link` | The in-text anchor | `href`, `variant?: 'primary'\|'muted'\|'plain'`, `external?` | `children` | native `<a>`; `external` pairs `target` and `rel` |
| `ExternalLink` | A link off the site | `href`, `variant?`, `untrusted? = true`, `showIcon? = true`, `newTabLabel? = '(opens in a new tab)'` | `children` | `rel="noreferrer nofollow"` when untrusted, `"noreferrer"` otherwise; the new tab is **in the accessible name**, icon `aria-hidden` |
| `Badge` | Short inline label | `tone? = 'neutral'`, `variant? = 'soft'`, `size? = 'md'`, `colourToken?` | `children` | none by design — the text carries the meaning |
| `Chip` | Colour swatch + short code | `label`, `title?`, `href?`, `colourToken?`, `size?: 'sm'\|'md'` | — | `<abbr title>` exposes the expansion; swatch `aria-hidden`; a link when `href` is set |
| `Card` | The surface | `as? = 'article'`, `title?`, `headingLevel? = 2`, `variant? = 'border'`, `size? = 'md'`, `padded? = true`, `bodyClass?` | `figure?`, `actions?`, `children` | `title` is a real heading at `headingLevel`; `as` picks the semantics (`article`/`section`/`div`) |
| `Alert` | Tone-coloured notice | `tone? = 'info'`, `variant? = 'soft'`, `title?`, `live?: 'assertive'\|'polite'\|'off'`, `onDismiss?`, `dismissLabel? = 'Dismiss'` | `icon?`, `children` | `live` → `role="alert"` \| `role="status"` \| no role; defaults assertive for `error`, polite otherwise; dismiss is a labelled `Button` |
| `EmptyState` | The quiet "nothing here" card | `title`, `description?`, `headingLevel? = 2` | `icon?`, `action?` | real heading; icon wrapped `aria-hidden` |
| `Skeleton` | Loading placeholders when the content's shape is known (use `Spinner` when it is not) | `variant?: 'block'\|'text'\|'circle'`, `lines? = 3`, `label? = 'Loading'` | — | `role="status"` + `aria-busy="true"`, named by `label`; every shimmering box `aria-hidden` |
| `Spinner` | An indeterminate loading indicator when the content's shape is unknown | `variant? = 'spinner'` (`spinner\|dots\|ring\|ball\|bars\|infinity`), `size?: Size = 'md'`, `tone?: Tone`, `label? = 'Loading'`, `showLabel? = false`, `decorative? = false` + `HTMLAttributes<HTMLSpanElement>` | — | `role="status"` named by `label`, the shape `aria-hidden`; `decorative` is the shape alone, `aria-hidden`, no role |
| `Stack` | Overlapping cards or images with a peek of the ones behind (daisyUI `stack`) | `items: readonly T[]`, `direction? = 'bottom'` (`'top'\|'bottom'\|'start'\|'end'`), `count? = items.length`, `countLabel? = (n) => \`${n} items\`` | `item(entry, top)` | only the first item is exposed: the rest are `inert` + `aria-hidden`, and the top item reads `countLabel(count)` so the depth is not visual-only. Not a flow layout: for that, `layout/VStack` / `HStack` |
| `Heading` | Addressable section heading | `level: 1…6`, `id?`, `anchor?`, `anchorLabel? = 'Link to this section'`, `children: string \| Snippet` | `children` | real `<h1…6>`; id slugged from string children at render (SSR-safe) |
| `VisuallyHidden` | Content for assistive tech only | — | `children` | `sr-only` |
| `Accordion` | A stack of headed, collapsible sections | `type: 'single'\|'multiple'`, `value? ⚓` (`string` / `readonly string[]`), `required?` (single), `headingLevel? = 3`, `variant?: 'arrow'\|'plus'\|'plain'`, `joined? = true`, `searchable? = true`, `disabled?` | `children` (`AccordionItem`s) | APG accordion on bits-ui: each title a native `<h{headingLevel}>` around an `aria-expanded` button that `aria-controls` a `region` it labels; ↑/↓, Home/End between headers; a `required` open item reports `aria-disabled`; closed panels are `hidden="until-found"`. Use a `Disclosure` for one native section, an `Accordion` when the sections need headings or a bound open value |
| `AccordionItem` | One section of an `Accordion` | `title: string \| Snippet`, `value?`, `disabled?`, `contentClass?` | `title?`, `children` | heading level and marker come from the `Accordion`, never per item |
| `Disclosure` | Expandable section | `open? ⚓`, `title: string \| Snippet`, `name?`, `variant?: 'arrow'\|'plus'\|'plain'`, `contentClass?` | `title?`, `children` | native `<details>`/`<summary>` — no hand-written `aria-expanded`; several sharing a `name` form an exclusive group |
| `Divider` | A horizontal or vertical rule, optionally labelled ("or") | `orientation? = 'horizontal'`, `decorative? = false`, `align?: 'start'\|'center'\|'end' = 'center'`, `tone?: Tone` + `HTMLAttributes<HTMLDivElement>` | `children?` (the label) | unlabelled: `role="separator"` (+ `aria-orientation="vertical"`); labelled: `role="none"`, the text reads in flow; `decorative`: `aria-hidden` |
| `Tooltip` | Hover/focus supplement | `text?`, `side? = 'top'`, `sideOffset? = 6`, `openDelay? = 400`, `open? ⚓` | `content?`, `children({ props })` | bits-ui `aria-describedby`; Escape closes |
| `Toolbar` | A row of controls that is one Tab stop (formatting bar, bulk actions, a tool palette) | `label`, `orientation? = 'horizontal'`, `loop? = true` | `children` (the parts below) | bits-ui `role="toolbar"` named by `label`, `aria-orientation`; one Tab stop; ←/→ (↑/↓ vertical), Home/End across every control. A toolbar is one composite widget; for independent actions that should each be a Tab stop, use `ButtonGroup` |
| `ToolbarButton` | A button in a `Toolbar` | `tone?`, `variant? = 'ghost'`, `size? = 'sm'`, `icon?`, `iconOnly?` | `children` | the library's `Button` on bits-ui `Toolbar.Button`; `iconOnly` keeps the text as a visually hidden name |
| `ToolbarLink` | A link in a `Toolbar` | `href` (through the context's `href()`) | `children` | a roving-focus control like the buttons |
| `ToolbarToggleGroup` | A toggle set inside a `Toolbar` | as `ToggleGroup`: `type`, `items`, `value? ⚓`, `onValueChange?`, `required?` (single), `label`, `tone?`, `variant? = 'ghost'`, `size? = 'sm'`, `disabled?` | — | on bits-ui `Toolbar.Group`, so it shares the toolbar's one Tab stop (a nested `ToggleGroup` would not); single is a `radiogroup` where arrows move and Space/Enter selects |
| `ToolbarSeparator` | A rule between groups in a `Toolbar` | `toolbarOrientation? = 'horizontal'` | — | `role="separator"` with the perpendicular `aria-orientation`; not focusable |
| `ButtonGroup` | A named cluster of independent buttons | `label`, `orientation? = 'horizontal'` (`'vertical'`, `'responsive'`) | `children` (each with `class="join-item"`) | `role="group"` named by `label`; no key handling, so every button stays a Tab stop |
| `ToggleButton` | A button that stays pressed (Bold, Mute, Favourite) | `pressed? ⚓`, `onPressedChange?`, `tone? = 'neutral'`, `variant? = 'ghost'`, `size?`, `iconOnly?` + `label` (required when icon-only), `tooltip?` | `children`, `icon?`, `pressedIcon?` | bits-ui `aria-pressed`; Space/Enter toggle; the name never changes with state; pressed is a fill + `btn-active`, not colour alone; `data-state="on"\|"off"` is a styling hook |
| `ToggleGroup` | Toggle buttons answering one question: a segmented control or a formatting bar | `type: 'single'\|'multiple'`, `items: readonly ToggleGroupItem[]` (`value`, `label`, `icon?`, `iconOnly?`, `disabled?`), `value? ⚓`, `onValueChange?`, `required?` (single), `label?` or `labelId?`, `describedBy?`, `invalid?`, `name?`, `orientation?`, `loop? = true`, `tone? = 'primary'`, `variant? = 'solid'`, `size?`, `block?`, `showCheck?`, `tooltip?`, `disabled?` | `item?(entry, { pressed })` | single: `role="radiogroup"` of radios, arrows move and select, Tab lands on the checked item, `required` keeps one selected; multiple: `role="group"` of `aria-pressed` buttons, arrows move only; one Tab stop; `name` posts one hidden input per selected value |
| `Popover` | Floating interactive panel | `open? ⚓`, `side? = 'bottom'`, `align? = 'center'`, `sideOffset? = 8`, `title?`, `closeLabel? = 'Close'` | `trigger({ props })`, `children` | bits-ui dialog ARIA: `aria-haspopup="dialog"`, `aria-expanded`, focus trap, Escape, focus return |
| `Menu` | Navigation list | `label`, `class?` | `children` | `<nav aria-label>` + `<ul class="menu">`; imports nothing from bits-ui |
| `DropdownMenu` | Application menu behind a trigger | `label`, `open? ⚓`, `side? = 'bottom'`, `align? = 'end'`, `class?` | `trigger?({ props })`, `children` | bits-ui `role="menu"`: `aria-haspopup`/`aria-expanded`, roving focus, typeahead, Escape, focus return. The only `Menu*` component that loads bits-ui's dropdown |
| `ContextMenu` (`./context-menu` entry) | Actions for a region, at the pointer | `label`, `open? ⚓`, `disabled? = false` (the browser's menu shows instead), `class?` | `trigger({ props })` (the region; spread `props`), `children` | bits-ui `role="menu"` named by `label`; opens on right-click, long-press, and Shift+F10 / the Menu key on the focused region (`props` carry `tabindex="0"`); roving focus, typeahead, → / ← submenus, Escape returns focus to the region. **Never the only route to an action** — see below |
| `MenuItem` | One entry of a `Menu`, `DropdownMenu` or `ContextMenu` | `href?`, `onSelect?`, `current?`, `disabled?` | `icon?`, `children` | in a `Menu`: `aria-current="page"` + `menu-active`; in a bits-ui menu: `role="menuitem"` |
| `MenuSeparator` | Rule between item groups | — | — | `role="separator"` (bits-ui's in a bits-ui menu, inside a `role="none"` `<li>`) |
| `MenuCheckboxItem` | An on/off setting in a bits-ui menu | `checked? ⚓`, `onCheckedChange?`, `disabled?` | `children` | `role="menuitemcheckbox"` + `aria-checked`; renders nothing in a `Menu` |
| `MenuRadioGroup` | One choice from a few, in a bits-ui menu | `value? ⚓`, `onValueChange?`, `label?` (visible heading, names the group) | `children` (the `MenuRadioItem`s) | `role="group"`; renders nothing in a `Menu` |
| `MenuRadioItem` | One option of a `MenuRadioGroup` | `value`, `disabled?` | `children` | `role="menuitemradio"` + `aria-checked`, exclusive within the group |
| `MenuSub` | An item that opens a submenu | `label`, `disabled?` | `children` (the submenu's items) | opener `role="menuitem"` with `aria-haspopup="menu"`; → opens, ← closes; renders nothing in a `Menu` |
| `ShareButton` | Platform share sheet | `title?`, `text?`, `url?`, `label? = 'Share'`, `tone?`, `variant? = 'ghost'`, `size? = 'sm'`, `onShare?`, `onError?` | `children?` | renders **nothing** without `navigator.share` (decided after mount) |
| `ThemeToggle` | Light / dark switch | `lightTheme`, `darkTheme`, `storageKey? = 'theme'`, `label? = 'Toggle dark mode'`, `value? ⚓` | — | checkbox with `role="switch"` named by `label` |
| `ConfirmButton` | Two-step inline confirm | `action: () => Promise<unknown>`, `idleLabel? = 'Delete'`, `confirmLabel?`, `cancelLabel?`, `pendingLabel?`, `confirmMessage?`, `failureMessage?`, `tone? = 'error'`, `redirectTo?` | — | failure is an `Alert live="assertive"`; both buttons `disabled` while pending; the confirm button keeps a name (`pendingLabel`) |

`ui` also exports:

- **`tones.ts`** — the daisyUI vocabulary as types: `Tone` (the semantic colours), `StatusTone` (`'info' | 'success' | 'warning' | 'error'`, what `Alert` takes), `Size` (`'xs'`…`'xl'`), `HeadingLevel` (`1`…`6`), `ButtonVariant`, `BadgeVariant`, `AlertVariant`, `LinkVariant` (`'primary' | 'muted' | 'plain'`), `CardVariant` (`'border' | 'dash' | 'plain'`), `DividerAlign`, `SpinnerVariant`, `DisclosureVariant` (`'arrow' | 'plus' | 'plain'`) and `ChipSize` (`'sm' | 'md'`). Each has a literal `Record<K, string>` class table, so Tailwind's scanner sees every class: `buttonTone`, `buttonVariant`, `buttonSize`, `badgeTone`, `badgeVariant`, `badgeSize`, `alertTone`, `alertVariant`, `progressTone`, `dividerTone`, `dividerAlign`, `dividerOrientation`, `loadingVariant`, `loadingSize`, `rangeTone`, `linkVariant`, `cardVariant`, `cardSize`, `collapseVariant` (the `Disclosure` marker), `chipSize`, `chipSwatchSize`, plus the prefix-free `backgroundTone` and `textTone` for a swatch or segment of your own.
- **`colour-token.ts`** — `colourTokenStyle`, for binding a component's colour custom property to a theme token, and the two properties it binds: `BADGE_COLOUR_PROPERTY` (`'--badge-colour'`, `Badge`'s) and `CHIP_COLOUR_PROPERTY` (`'--chip-colour'`, `Chip`'s).
- **`menu-context.ts`** — `MenuMode` (`'dropdown' | 'context' | 'nav'`) and `getMenuMode()`, which tells a menu item of your own which kind of menu it is in: `'dropdown'` inside a `DropdownMenu`, `'context'` inside a `ContextMenu`, otherwise `'nav'`.

**A context menu is never the only route to an action.** It is invisible until summoned: keyboard users can open it with Shift+F10 or the Menu key on the focused region, but touch screen-reader users and many keyboard users never discover it. Put every action in a `ContextMenu` somewhere visible as well — a row's "More" `DropdownMenu`, a toolbar. The menu children (`MenuItem`, `MenuSeparator`, `MenuCheckboxItem`, `MenuRadioGroup` / `MenuRadioItem`, `MenuSub`) import nothing from bits-ui: `DropdownMenu` and `ContextMenu` lend them their bits-ui parts through context, so a page that only renders a navigation `Menu` never loads the menu runtime.

- **`slug.ts`** — `slugify`, used by `Heading`.

```svelte
<script lang="ts">
  import { Button, LinkButton, Link, Card, EmptyState, Alert, Heading, Disclosure } from '@thomasfosterau/components';
  import { Plus } from '@lucide/svelte';
</script>

<Button tone="primary" loading={saving} onclick={save}>
  {#snippet icon()}<Plus class="size-4" aria-hidden="true" />{/snippet}
  Add a plant
</Button>
<LinkButton href="/gardens/new" tone="primary">Start a garden</LinkButton>

<!-- A bare Card is exactly `card card-border bg-base-100 shadow-sm` plus a padded body. -->
<Card title="Tomato 'Black Krim'">
  <p>Sown 14 September; two of six seedlings survived the frost.</p>
  {#snippet actions()}<Button tone="primary" size="sm">Open</Button>{/snippet}
</Card>

{#if gardens.length === 0}
  <EmptyState title="No gardens yet" description="Start with one and add the plants later." />
{/if}

{#if error}<Alert tone="error" title="Could not save">{error}</Alert>{/if}

<Heading level={2} anchor>Growing conditions</Heading>
<Disclosure title="Add an anatomy record" bind:open={sectionOpen}>
  <AnatomyForm />
</Disclosure>
```

```svelte
<script lang="ts">
  import { Menu, DropdownMenu, MenuItem, MenuSeparator, Button, ThemeToggle } from '@thomasfosterau/components';
  import { ChevronDown } from '@lucide/svelte';
</script>

<!-- Sidebar: a landmark, a list, links, aria-current from the context. -->
<Menu label="Primary">
  <MenuItem href="/gardens">Gardens</MenuItem>
  <MenuItem href="/taxa">Taxa</MenuItem>
</Menu>

<!-- Account menu: bits-ui roving focus, typeahead, Escape, focus return. -->
<DropdownMenu label="Account">
  {#snippet trigger({ props })}
    <Button {...props} variant="ghost">Ada Lovelace<ChevronDown class="size-4" aria-hidden="true" /></Button>
  {/snippet}
  <MenuItem href="/account">Your profile</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={signOut}>Sign out</MenuItem>
</DropdownMenu>

<ThemeToggle lightTheme="garden-light" darkTheme="garden-dark" storageKey="garden:theme" />
```

## layout

The landmarks a page is assembled from, and the blocks that sit inside them. Structure only, never copy: every component takes the app's content as snippets and owns just the element that carries the semantics.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Main` | The page content column | `as? = 'main'` (`'main'\|'section'`) + `HTMLAttributes<HTMLElement>` | `children` | `<main>` is THE landmark, one per page |
| `Hero` | The top of a landing or "about" page: headline, copy and calls to action | `title: string \| Snippet`, `description?`, `headingLevel? = 1`, `align?: 'start' \| 'center'`, `backgroundImage?`, `actionsLabel? = 'Actions'` | `actions?`, `figure?`, `children?` | A `<section>` named by its heading; `actions` is a `role="group"`; a background image is decorative CSS under an overlay, never an `<img>`. A page has one `<h1>`: don't pair a `Hero` with a `PageHeader` at level 1 |
| `PageHeader` | What the page is about, and what you can do to it | `title: string \| Snippet`, `subtitle?`, `headingLevel? = 1`, `actionsLabel? = 'Page actions'` | `eyebrow?`, `icon?`, `meta?`, `actions?`, `children?` | `title` is a real heading; `actions` is a `role="group"` named by `actionsLabel`; `icon` is `aria-hidden` |
| `AppShell` | The responsive app frame | `navOpen? ⚓`, `navLabel? = 'Menu'`, `navTitle? = 'Navigation'` | `sidebar`, `header?({ triggerProps })`, `children` | the sidebar is a plain column from `lg` up and a `Drawer side="start"` below it, with exactly one `navigation` landmark in the tree at any width; close it on navigation with `afterNavigate(() => (navOpen = false))` |
| `Breadcrumbs` | The ancestor trail | `items: readonly Crumb[]`, `label? = 'Breadcrumb'` | `item?(crumb, index)` | `<nav aria-label>` + `<ol>`; ancestors are links, the trailing crumb is text with `aria-current="page"` |
| `Navbar` | The site banner | `label? = 'Primary'`, `menuLabel? = 'Menu'`, `menuOpen? ⚓` | `start`, `center?`, `end?`, `menu?` | `<header>` (`banner`) > `<nav aria-label>`; the responsive toggle is a bits-ui `Collapsible` |
| `Footer` | The site footer | — + `HTMLAttributes<HTMLElement>` | `children`, `aside?` | `<footer>` (`contentinfo`); `aside` renders first |
| `DetailLayout` | The two-column detail shell | `asideLabel? = 'Summary'` | `header`, `body`, `aside?` | `<aside aria-label>` (`complementary`); mobile order title → aside → body by reordering one render, not rendering twice |
| `Section` | A titled block of a page | `title`, `headingLevel? = 2`, `headingId?`, `count?`, `description?`, `empty? = false`, `emptyMessage? = 'Nothing here yet.'`, `locales?` | `children`, `actions?`, `emptyState?` | `<section aria-labelledby>` pointing at its own heading; `headingId` defaults to a slug of `title` |
| `Tabs` | One strip, two things | `items: readonly TabItem[]`, `mode? = 'panels'`, `value? ⚓`, `label? = 'Sections'`, `variant? = 'border'`, `size? = 'md'` | `panel?(item)` | panels: bits-ui `Tabs` (tablist/tab/tabpanel, roving tabindex, arrows); links: `<nav>` of anchors with `aria-current="page"` |
| `FilterBar` | The filter row above a list | `options: readonly FilterOption[]`, `label` | — | `<nav aria-label>` of `btn`-styled anchors; the active one carries `aria-current="page"` |
| `Sidebar` | The standing navigation column | `label?`, `title?`, `headingLevel? = 2` | `brand?`, `footer?`, `children` (the `MenuItem`s) | the landmark is `Menu`'s; deliberately not an `<aside>` — `complementary` is the wrong landmark for primary navigation; for narrow viewports put it in an `AppShell` |

`layout` also exports `types.ts` (`Crumb`, `TabItem`, `FilterOption`, `TabsMode`, `TabsVariant`, `tabsVariant`, `tabsSize`).

```svelte
<script lang="ts">
  import { Main, PageHeader, Breadcrumbs, Section, DetailLayout, Infobox, Tabs, Sidebar, MenuItem } from '@thomasfosterau/components';
</script>

<Main class="mx-auto max-w-5xl space-y-8 p-6">
  <PageHeader title="Tomato 'Black Krim'" subtitle="Solanum lycopersicum" actionsLabel="Plant actions">
    {#snippet eyebrow()}
      <Breadcrumbs items={[{ label: 'Gardens', href: '/gardens' }, { label: 'Tomato' }]} />
    {/snippet}
  </PageHeader>

  <!-- `count` is the unpaged total; the rows are a preview, so the two differ. -->
  <Section title="Observations" count={1284} description="The most recent three.">
    <ul>{#each recent as row (row.id)}<li>{row.label}</li>{/each}</ul>
  </Section>
</Main>

<!-- DetailLayout opens NO landmark of its own: it goes inside `Main`, so the page keeps one `<main>`. -->
<Main>
  <DetailLayout asideLabel="Key facts">
    {#snippet header()}<PageHeader title="Rosa canina" subtitle="Dog rose" />{/snippet}
    {#snippet aside()}<Infobox title="Rosa canina" rows={facts} />{/snippet}
    {#snippet body()}<p>{article}</p>{/snippet}
  </DetailLayout>
</Main>

<!-- A widget: one document, panels swapped in place. -->
<Tabs items={views} bind:value={tab}>
  {#snippet panel(item)}<ResultsTable view={item.value} />{/snippet}
</Tabs>
<!-- Navigation: separate routes — anchors and `aria-current`, never `role="tab"`. -->
<Tabs items={views} mode="links" label="Results views" />

<Sidebar title="Browse">
  {#snippet brand()}<a href="/" rel="home">Home</a>{/snippet}
  <MenuItem href="/posts">Posts</MenuItem>
  <MenuItem href="/tags">Tags</MenuItem>
</Sidebar>
```

### Layout primitives and spacing scale

`VStack`, `HStack`, `Cluster`, `Grid`, `Spacer` and `Fits` are thin, typed wrappers over Tailwind utilities with a constrained vocabulary. Use them where the spacing should follow the library's rhythm (a stack of fields, a row of buttons, a grid of cards). Write raw Tailwind for one-off layout the scale has no step for. The tokens are literal tables in `layout/space.ts`, exported from the barrel:

| Token | Steps |
| --- | --- |
| `Gap` → `gapClass` | `none` 0, `xs` 0.25rem, `sm` 0.5rem, `md` 1rem (default), `lg` 2rem, `xl` 3rem |
| `MinItem` → `minItemClass` | `xs` 10rem, `sm` 12rem, `md` 16rem, `lg` 20rem: the narrowest a `Grid` item gets |
| `FitsBreakpoint` | `20rem`, `28rem`, `36rem`, `48rem`, `64rem` |

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `VStack` / `HStack` | Children in a column / row (SwiftUI `VStack` / `HStack`) | `gap? = 'md'`, `align?`, `justify?` (`'start'\|'center'\|'end'\|'between'`), `divider?`, `as? = 'div'` (`'div'\|'ul'\|'ol'\|'section'\|'nav'`); `HStack` adds `responsive?` (a column below `sm`) | `children` | none of their own; `as="ul"`/`"ol"` restores `role="list"` (children `<li>`); `divider` is a decorative rule between children only; no `reverse`, so visual order never contradicts the DOM (WCAG 1.3.2) |
| `Cluster` | Wrapping inline items: tags, buttons | `gap? = 'sm'`, `align? = 'center'`, `justify?`, `as?` | `children` | as above |
| `Grid` | Columns by minimum item width, not breakpoints | `minItem? = 'md'`, `gap? = 'md'`, `as?` | `children` | as above |
| `Spacer` | Flexible space in a stack: pushes the rest to the far end | — | — | `aria-hidden` |
| `Fits` | The first layout that fits its container (SwiftUI `ViewThatFits`) | `layouts: Snippet[]` (widest first), `breakpoints: FitsBreakpoint[]` (one fewer, descending) | — | switches at declared container widths with `@container` queries, no JavaScript (CSS cannot measure content). Inactive layouts are `display: none`, so exactly one copy of each control is in the accessibility tree |

`ui/Stack` is a different thing: daisyUI's overlapping pile of cards.

## feedback

Dialogs, toasts, progress — chrome around something that just happened, or is happening now. What these share is the live region and the announcement order, not the markup.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Dialog` | The modal | `open? ⚓`, `title`, `description?`, `closeLabel? = 'Close'`, `size?: 'sm'\|'md'\|'lg'\|'xl'` | `trigger?({ props })`, `children`, `actions?({ close })` | bits-ui `Dialog` owns it all: `role="dialog"` + `aria-modal`, `aria-labelledby`/`describedby`, focus trap, Escape, scroll lock, focus return. daisyUI `modal-box` is styling only |
| `Drawer` | A modal panel at an edge: a filters sheet, an action sheet, mobile navigation | `open? ⚓`, `title`, `description?`, `side? = 'end'` (`'start'\|'end'\|'top'\|'bottom'`), `size? = 'md'` (`'sm'\|'md'\|'lg'\|'full'`), `closeLabel? = 'Close'`, `hideTitle?` | `trigger?({ props })`, `children`, `actions?({ close })` | `Dialog`'s contract through a shared internal body: `role="dialog"` + `aria-modal`, named by `title` (kept as the name with `hideTitle`), focus moved in, trapped and returned, Escape and overlay dismissal, scroll lock. `start` / `end` follow the writing direction. Not daisyUI's checkbox `drawer`, which has none of that. No swipe-to-dismiss in v1 |
| `ConfirmDialog` | A destructive action behind a confirmation | `open? ⚓`, `title`, `description?`, `confirmLabel? = 'Delete'`, `cancelLabel? = 'Cancel'`, `pendingLabel? = 'Working…'`, `failureMessage? = 'That didn’t work. Try again.'`, `closeLabel? = 'Close'`, `tone? = 'error'`, `size? = 'md'`, **either** `onConfirm: () => Promise<unknown>` **or** `form: ConfirmForm`, `redirectTo?` | `trigger?({ props })`, `children?` | `Dialog`'s, plus a failure as an `Alert live="assertive"` inside the still-open dialog; both buttons `disabled` while pending |
| `Toaster` | The notification region | `position? = 'bottom-end'`, `regionLabel? = 'Notifications'`, `dismissLabel? = 'Dismiss'`, `durationMs? = 6000` | `children` (the app) | ONE `aria-live="polite"` region, present from mount, named by `regionLabel`; nothing live nested inside it — `getToaster()` gives `add({ title, description?, tone? }, durationMs?) → id` and `dismiss(id)` |
| `LoadingBoundary` | Chrome around one read | `state: 'loading'\|'refreshing'\|'error'\|'ready'`, `loadingLabel? = 'Loading…'`, `errorLabel?`, `tone?: 'page'\|'section'` | `children`, `loading?`, `failed?({ message })` | loading chrome `role="status"`; failure `role="alert"`; children stay mounted through `refreshing` |
| `ProgressBar` | Determinate or indeterminate progress | `label`, `value?`, `max? = 100`, `tone? = 'primary'`, `showValue?`, `locales?` | — | native `<progress>`, named by `label`; no `value` attribute at all when indeterminate |
| `SegmentBar` | A proportional stacked bar | `label`, `segments: readonly BarSegment[]`, `showValues?`, `marker?` (a fraction), `size? = 'md'` (`'sm'\|'md'\|'lg'`), `locales?` | — | ONE `role="img"` whose `aria-label` spells out every segment ("Storage: Photos 62%, Video 31%") |
| `StatTile` | One headline figure | `label`, `value: string \| number`, `delta?: StatDelta`, `description?`, `upLabel? = 'Up'`, `downLabel? = 'Down'`, `flatLabel? = 'No change'`, `locales?` | `figure?` | reads label → value → change; the trend arrow is `aria-hidden`, direction is in visually hidden text |
| `Stats` | The wrapper a row of tiles sits in | `orientation?: 'horizontal'\|'vertical'\|'responsive'` (default `responsive`) | `children` | none of its own — name it with `aria-label` when a page has several |
| `Steps` | The stages of a short multi-step flow | `items: readonly StepItem[]`, `label`, `current?: number`, `orientation?: 'horizontal'\|'vertical'\|'responsive'` (default `horizontal`), `tone? = 'primary'`, `completeLabel? = 'Completed'`, `currentLabel? = 'Current step'`, `upcomingLabel? = 'Not started'`, `errorLabel? = 'Error'` | `marker?(step, index)` | `<ol>` named by `label`; each step reads its label then its state ("Sow, Completed"), never colour alone; the marker is `aria-hidden`; the current step (or its link) is `aria-current="step"`; a step's own `state` overrides the one derived from `current` |
| `Timeline` | A dated sequence | `items: readonly TimelineEntry[]`, `label? = 'Timeline'`, `presentLabel? = 'present'`, `toLabel? = 'to'`, `currentLabel? = 'Current'` | `item?(entry)` | `<ol>` named by `label`; an open-ended entry is introduced by `currentLabel` |

`feedback` also exports `sizes.ts` (`DialogSize`, `ToastPosition`, `BarSize`, `StatsOrientation` and their class tables `dialogSize`, `toastPosition`, `barSize`, `statsOrientation`) and `toaster.ts` (`getToaster`, `setToaster`, `Toast`, `NewToast`, `ToastTone`, `ToasterApi`), plus the prop types below. `colourToken` on a `SegmentBar` segment or a `TimelineEntry` is a CSS custom-property name your theme declares — see `ui`'s `colourTokenStyle`.

| Type | What it is |
| --- | --- |
| `ConfirmForm` | `ConfirmDialog`'s `form` prop — a progressive-enhancement POST: `{ action, method?: 'POST', fields?: Record<string, string>, enhance?: (form) => void \| (() => void) }`. `fields` become hidden inputs inside the form; `enhance` is your app's own `use:enhance`. |
| `BarSegment` | One `SegmentBar` part: `{ label, fraction, colourToken?, tone? }`, `fraction` in `[0, 1]`; `tone` applies only when there is no `colourToken`. |
| `StatDelta` | `StatTile`'s change line: `{ value, unit?: 'count' \| 'percent' \| 'points', label? }`. Positive is up; with `unit: 'percent'`, `3.2` renders as `+3.2%`. |
| `TimelineEntry` | One `Timeline` entry: `{ id, label, subtitle?, start: TimelineDate, end?: TimelineDate, href?, colourToken? }`. Omit `end` for an open-ended, still-current entry; `href` resolves through the components context. |
| `TimelineDate` | One end of a span: `{ label, dateTime? }` — the display text and the machine-readable `<time datetime>` value. |

```svelte
<script lang="ts">
  import { Dialog, ConfirmDialog, Toaster, getToaster, LoadingBoundary, ProgressBar, Stats, StatTile, Button, Skeleton } from '@thomasfosterau/components';
</script>

<Dialog title="Move this plant?" description="It keeps its history — only the bed changes.">
  {#snippet trigger({ props })}<Button {...props} variant="outline">Move plant</Button>{/snippet}
  <p>'Black Krim' moves from North bed to the Glasshouse.</p>
  {#snippet actions({ close })}<Button tone="primary" onclick={close}>Move it</Button>{/snippet}
</Dialog>

<ConfirmDialog title="Delete this garden?" onConfirm={() => deleteGarden(id)} redirectTo="/gardens">
  {#snippet trigger({ props })}<Button {...props} tone="error">Delete garden</Button>{/snippet}
</ConfirmDialog>

<!-- Root layout: one region for the whole app. -->
<Toaster position="bottom-end">{@render children()}</Toaster>
```

```svelte
<script lang="ts">
  // Anywhere below a Toaster.
  const toaster = getToaster();
  toaster.add({ title: 'Bed saved', tone: 'success' });
  toaster.add({ title: 'Could not save the bed', tone: 'error' }, 0); // 0 = sticky

  // 'loading' only for a FIRST read; 'refreshing' while a re-fetch runs over content already on screen.
  const state = $derived(query.error ? 'error' : query.data === undefined ? 'loading' : query.pending ? 'refreshing' : 'ready');
</script>

<LoadingBoundary {state} loadingLabel="Loading beds…" errorLabel="The beds didn't load.">
  {#snippet loading()}<Skeleton variant="text" lines={3} label="Loading beds" />{/snippet}
  <BedList beds={query.data} />
</LoadingBoundary>

<ProgressBar label="Seeds germinated" value={62} showValue />
<Stats aria-label="Garden summary">
  <StatTile label="Plants recorded" value={1284} delta={{ value: 46, label: 'this month' }} />
</Stats>
```

## fields

Form controls wired through the `FormField` + `FieldControl` contract. `FormField` (one control) or `Fieldset` (a group) owns the label, hint and errors; it derives `hintId`/`errorId` from a single `id` and hands `children` a `FieldControl`:

```ts
interface FieldControl {
  id: string;
  labelId: string; // the visible <label>'s id
  describedBy: string;
  invalid: boolean;
  required: boolean;
}
```

Every primitive accepts it by spread — `<TextInput {...control} bind:value />` — so `for`/`id`, `aria-describedby`, `aria-invalid` and `required` cannot drift apart. `errors` is always `readonly string[]`; a field that fails three rules says three things.

**When a control uses `labelId`.** `<label for>` names only a labelable element (`input`, `select`, `textarea`, `button`, `meter`, `output`, `progress`); every primitive above is one, and ignores `labelId` (it never reaches the DOM as an attribute). A control whose focusable part is a role on a `span` or `div` — a `role="slider"` thumb, a `role="group"` or `radiogroup` root, a segmented date group — points `aria-labelledby={control.labelId}` at the label instead, and `FormField` forwards a click on its label to it (the control itself if focusable, else its first focusable descendant). `Fieldset` hands its `children` a `FieldsetControl` (`{ labelId }`, the `<legend>`'s id) for the same purpose. `RadioGroup` is its own frame with its own `legend`, so it takes neither.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `FormField` | Label + hint + errors around one control | `id?`, `label`, `hint?`, `errors?: readonly string[]`, `required?`, `requiredLabel? = '(required)'` + `HTMLAttributes<HTMLDivElement>` | `children(control)` | `<label for>` names the control (a role-based control uses `aria-labelledby={labelId}`; label clicks are forwarded to it); `describedBy` lists hint id then error id; `aria-invalid` when there are errors |
| `Fieldset` | The same frame for a GROUP | `legend`, `hint?`, `errors?`, `required?`, `requiredLabel?` + `HTMLAttributes<HTMLFieldSetElement>` | `children({ labelId })` | real `<fieldset>`/`<legend>`; `labelId` is the legend's id; hint/errors are `aria-describedby` on the fieldset; `data-invalid` instead of `aria-invalid` (the implicit `group` role rejects it) |
| `TextInput` | The daisyUI `input` | `value ⚓`, `type? = 'text'` (`text\|email\|url\|password\|tel\|number\|search`), `size?: FieldSize`, `invalid?`, `describedBy?` + `HTMLInputAttributes` | — | native `<input>`; for a password with a show/hide toggle use `PasswordInput`, and for a number `NumberField` (`type="number"` neither formats nor parses the reader's locale and returns a string) |
| `Textarea` | The daisyUI `textarea` | `value ⚓`, `rows? = 4`, `size?`, `invalid?`, `describedBy?` | — | native `<textarea>` |
| `Select` | One choice, natively | `options: (FieldOption \| string)[]`, `value ⚓`, `placeholder?`, `size?`, `invalid?`, `describedBy?` | — | native `<select>`; placeholder is a disabled first `<option>` |
| `Slider` | A number, or a `[low, high]` range, from a bounded stepped scale | `type? = 'single'` (`'single'` binds `value ⚓: number`, `'multiple'` binds `value ⚓: number[]`, default `[min, max]`), `min? = 0`, `max? = 100`, `step? = 1` (`number \| readonly number[]` snap points), `orientation? = 'horizontal'`, `ticks? = false`, `formatValue?: (v) => string` (default `Intl.NumberFormat(locales)`), `locales?`, `showValue? = true`, `thumbLabels? = ['Minimum', 'Maximum']`, `onCommit?: (value) => void`, `name?`, `disabled?`, `tone?: Tone = 'primary'`, `size?: FieldSize`, `label?`, `labelId?`, `id?`, `describedBy?`, `invalid?` + `HTMLAttributes<HTMLSpanElement>` | — | bits-ui `Slider`: each thumb `role="slider"` with `aria-valuetext` from `formatValue`; arrows step, Page Up/Down jump a tenth, Home/End; named by `aria-labelledby={labelId}` (range thumbs add their own `thumbLabels` entry) or by `label`; one hidden input per thumb under `name` |
| `Rating` | A score out of N as stars, or a static "4.5 out of 5" display | `value ⚓ = 0`, `max? = 5`, `allowHalf? = false`, `readonly? = false`, `hoverPreview? = true`, `formatValue?: (value, max) => string` (default `` `${value} out of ${max}` ``), `name?`, `disabled?`, `tone?: Tone = 'warning'`, `size?: Size = 'md'`, `label? = 'Rating'`, `labelId?`, `id?`, `describedBy?`, `invalid?`, `required?` + `HTMLAttributes<HTMLDivElement>` | `item?: { state }` (replace the star glyph) | bits-ui `RatingGroup`: root `role="slider"` (one Tab stop) with `aria-valuetext` from `formatValue`; arrows step (half steps with `allowHalf`), Home/End, digits jump; named by `aria-labelledby={labelId}` or `label`; `readonly` is `role="img"` named by `formatValue`, nothing focusable |
| `PinInput` | A fixed-length code (sign-in code, TOTP, invite) typed one character per cell | `value ⚓`, `length? = 6`, `charset? = 'numeric'` (`'numeric' \| 'alphanumeric'`), `masked? = false`, `onComplete?: (code) => void`, `pasteTransformer? = strip whitespace and hyphens`, `autocomplete? = 'one-time-code'`, `size?: FieldSize`, `disabled?`, `id?`, `describedBy?`, `invalid?` + `HTMLInputAttributes` (on the real input) | — | ONE real `<input>` (bits-ui `PinInput`) named by `FormField`'s `<label for>`, with `inputmode` and `pattern` from `charset`; the cells are `aria-hidden` presentation |
| `PasswordInput` | A password with a show/hide toggle and the right `autocomplete` | `value ⚓`, `purpose? = 'current'` (`'current' \| 'new'` → `current-password` / `new-password`), `revealed ⚓ = false`, `revealable? = true`, `showLabel? = 'Show password'`, `size?`, `inputClass?`, `id?`, `describedBy?`, `invalid?` + `HTMLInputAttributes` (on the inner input; `class` on the wrapper) | — | native password `<input>` named by `FormField`'s `<label for>`; the toggle is a `type="button"` with a constant name and `aria-pressed`, `aria-controls` the input, keeps the selection; the field hides again when its form submits |
| `MultiSelect` | Several choices from a longer known list, summarised in a compact trigger | `options: (FieldOption \| string)[]`, `values ⚓: string[]` (kept in option order), `placeholder? = 'Select…'`, `name?`, `maxShown? = 2`, `formatOverflow? = (n) => \`+${n}\``, `portal? = true`, `disabled?`, `size?`, `id?`, `describedBy?`, `invalid?`, `required?`+`HTMLAttributes<HTMLDivElement>` on the wrapper | `option?(option, { selected })` | bits-ui `Select` (`type="multiple"`): trigger `role="combobox"` named by `FormField`'s `<label for>`, `role="listbox"` with `aria-multiselectable`, options with `aria-selected` / `aria-disabled`; stays open while toggling; one hidden input per value under `name` |
| `NumberField` | An exact number, locale-formatted, with − / + steppers | `value ⚓: number \| undefined`, `min?`, `max?`, `step? = 1`, `largeStep? = step * 10`, `formatOptions?: Intl.NumberFormatOptions` (unit, percent, currency, digits), `locales?`, `showStepper? = true`, `decrementLabel? = 'Decrease'`, `incrementLabel? = 'Increase'`, `onCommit?: (value) => void` (blur, Enter or a step), `name?` (posts the raw number), `size?`, `disabled?`, `id?`, `describedBy?`, `invalid?` + `HTMLInputAttributes` | — | APG spinbutton: `role="spinbutton"` with `aria-valuenow`/`min`/`max` and the formatted `aria-valuetext`; arrows ± `step`, Page Up/Down ± `largeStep`, Home/End to the bounds; − / + are `tabindex="-1"` buttons that `aria-controls` the input, disabled at the bounds, and auto-repeat while held |
| `TagsInput` | An open-ended list of short strings, each a removable chip | `values ⚓: string[]`, `name?`, `delimiters? = [',']`, `normalise?: (text) => string \| undefined` (default trims, refuses empty), `allowDuplicates? = false`, `max?`, `suggestions?: readonly string[]` **or** `onSearch?: (query, signal) => Promise<readonly string[]>`, `debounceMs? = 150`, `placeholder? = 'Add a tag'`, `removeLabel? = (tag) => \`Remove ${tag}\``, `addedMessage?`, `removedMessage?`, `disabled?`, `size?`, `id?`, `describedBy?`, `invalid?`, `required?`(at least one committed tag),`requiredMessage? = 'Add at least one tag.'`+`HTMLAttributes<HTMLDivElement>` | `tag?(tag)` | `role="list"` of tags with named remove buttons; the text input (a bits-ui combobox when suggestions are on) is named by `FormField`; Enter / delimiter commits, Backspace and arrows reach the tags, a paste is split; focus never lost after removal; adds / removes announced in a polite live region |
| `Dropzone` | Several files by drop or by a "Choose files" button, listed and removable; never uploads | `files ⚓: File[]`, `accept?` (enforced on drop too), `maxBytes?`, `maxFiles?`, `multiple? = true`, `name?`, `onSelect?(accepted, rejected: FileRejection[])`, `previews? = true`, `promptLabel? = 'Drop files here or'`, `chooseLabel? = 'Choose files'`, `removeLabel?(file)`, `tooLargeMessage?(file)`, `wrongTypeMessage?(file)`, `tooManyMessage?(max)`, `selectedMessage?(count)`, `locales?`, `disabled?`, `id?`, `describedBy?`, `invalid?`, `required?` + `HTMLAttributes<HTMLDivElement>` | `file?(file, { remove })` | the choose `<button>` is named by `FormField`'s `<label for>`; files are a `<ul>` with named remove buttons (focus moves to the neighbour); rejections in one `role="alert"`; a polite live region counts the selection; a hidden native input posts the files |
| `Calendar` (`/dates`) | An inline month grid for one date | `value ⚓: DateValue`, `month ⚓`, `minValue?`, `maxValue?`, `isDateDisabled?(date)`, `isDateUnavailable?(date)`, `numberOfMonths? = 1`, `weekStartsOn?`, `fixedWeeks?`, `locales?`, `calendarLabel? = 'Calendar'`, `previousLabel? = 'Previous month'`, `nextLabel? = 'Next month'`, `disabled?`, `readonly?`, `id?`, `labelId?`, `describedBy?`, `invalid?` | `day?({ date, selected, unavailable })` | bits-ui `role="application"` named by `labelId` (or `calendarLabel` + month), a `role="grid"` per month named "October 2026", roving tabindex; arrows / Home / End / Page Up / Page Down / Enter; unavailable days struck through and `aria-disabled` |
| `RangeCalendar` (`/dates`) | An inline month grid for a start–end range | as `Calendar`, with `value ⚓: { start, end }`, `minDays?`, `maxDays?`, `excludeDisabled? = false` | `day?(…)` | `Calendar`'s; the band reads bits-ui's `data-range-*` |
| `DateField` (`/dates`) | Segmented day / month / year entry | `value ⚓: DateValue`, `minValue?`, `maxValue?`, `granularity? = 'day'` (`'day'\|'hour'\|'minute'\|'second'`), `hourCycle?: 12\|24`, `name?`, `locales?`, `disabled?`, `readonly?`, `size?`, `id?`, `labelId?`, `describedBy?`, `invalid?`, `required?` | — | a `role="group"` named by `labelId`, described by `describedBy`, `aria-invalid` in error; each segment a `role="spinbutton"` named "day, <label>"; digits, ↑/↓, ←/→, Backspace; separators `aria-hidden`; the locale sets the order; `name` posts ISO `YYYY-MM-DD` |
| `TimeField` (`/dates`) | Segmented hour / minute entry | as `DateField`, with `value ⚓: TimeValue` and `granularity? = 'minute'` (`'hour'\|'minute'\|'second'`) | — | `DateField`'s; AM/PM is a segment only on a 12-hour clock; `name` posts ISO `HH:MM:SS` |
| `DatePicker` (`/dates`) | A `DateField` plus a calendar popover | as `DateField`, plus `open? ⚓`, `closeOnDateSelect? = true`, `isDateDisabled?`, `isDateUnavailable?`, `weekStartsOn?`, `numberOfMonths? = 1`, `triggerLabel? = 'Choose date'`, `calendarLabel? = 'Calendar'`, `previousLabel?`, `nextLabel?` | — | `DateField`'s group, with an icon-only trigger named by `triggerLabel` (`aria-haspopup="dialog"`, `aria-expanded`) opening a `role="dialog"` named by `calendarLabel` around `Calendar`'s grid; picking a day closes it and returns focus to the trigger |
| `DateRangePicker` (`/dates`) | Start and end date fields plus a range-calendar popover | as `DatePicker`, with `value ⚓: { start, end }`, `minDays?`, `maxDays?`, `closeOnRangeSelect? = true`, `startName?` / `endName?` (in place of `name`), `startLabel? = 'Start date'`, `endLabel? = 'End date'` | — | one `role="group"` named by `labelId` and described by `describedBy`, holding a group per half named by `startLabel` / `endLabel` (segments read "day, <label> Start date"); the dash is `aria-hidden` |
| `Checkbox` | One box with its own label | `label`, `checked ⚓`, `size?`, `invalid?`, `describedBy?` + `HTMLInputAttributes` | — | `<label>`-wrapped `<input type="checkbox">` — no `id`/`for` pair needed |
| `CheckboxGroup` | Several boxes, one question | `legend`, `options`, `values ⚓: string[]`, `name?`, `hint?`, `errors?`, `required?`, `disabled?`, `size?` | — | a `Fieldset` of `Checkbox` |
| `RadioGroup` | One choice from a short list | `legend`, `options`, `value ⚓`, `orientation? = 'vertical'`, `name?`, `hint?`, `errors?`, `required?`, `disabled?` | — | bits-ui `RadioGroup`: one tab stop, arrows move and select, wrap-around |
| `Toggle` | A setting that takes effect now | `checked ⚓`, `label`, `description?`, `onChange?: (next) => Promise<boolean> \| boolean`, `size?`, `invalid?`, `describedBy?` | — | `role="switch"` on a native checkbox; `description` is `aria-describedby`, never folded into the name; `aria-busy` while `onChange` is in flight — a switch; for a button that stays pressed, see `ToggleButton` |
| `PushToggle` | Web Push for THIS browser behind a `Toggle`: reads the subscription on mount, subscribes / unsubscribes through the app's own client | `available: boolean`, `enable: (signal) => Promise<PushEnableResult>` (`{ _tag: 'enabled' \| 'unsupported' \| 'unavailable' \| 'denied' }` — resolves, never throws), `disable: (signal) => Promise<unknown>`, `supported?` / `readSubscribed?` (default: the browser's own checks), `label? = 'Send push notifications to this browser'`, `description?`, `unavailableMessage?`, `unsupportedMessage?`, `deniedMessage?` (English defaults) | — | `Toggle`'s; the refusal message is a polite live region |
| `DateInput` | An ISO calendar date | `value ⚓` (`YYYY-MM-DD`), `min?`, `max?`, `size?`, `invalid?`, `describedBy?` | — | native `<input type="date">` |
| `FileInput` | A file, with a size cap | `file ⚓: File \| undefined`, `accept?`, `maxBytes?`, `tooLargeMessage? = 'That file is too large.'`, `onSelect?`, `size?`, `invalid?`, `describedBy?` | — | native file input; an over-size file is cleared and explained in an `alert` |
| `ImageInput` | `FileInput` + preview + dimension probe | `file ⚓`, `width ⚓`, `height ⚓`, `previewAlt? = 'Preview of the selected image'`, `name?`, `accept?`, `maxBytes?`, `tooLargeMessage?` | — | preview `<img>` named by `previewAlt`; emits hidden `width`/`height` inputs once `name` is set |
| `VideoInput` | `FileInput` + a progress readout | `file ⚓`, `progress ⚓` (0–100), `progressLabel? = 'Upload progress'`, `onSelect?`, `accept? = 'video/*'`, `maxBytes?`, `tooLargeMessage?` | — | native `<progress>` named by `progressLabel`, shown only while `0 < progress < 100` |
| `SearchInput` | A search field with clear and spinner | `label`, `value ⚓`, `onInput?`, `onSubmit?`, `onClear?`, `pending?`, `clearLabel? = 'Clear search'`, `size?`, `name? = 'q'`, `placeholder? = 'Search'` | — | composite `<div class="input">`; icon/spinner `aria-hidden`; clear button labelled |
| `Combobox<T>` | Typeahead over a list or a search | `value ⚓: string \| undefined`, `items?: readonly T[]` **or** `onSearch: (query, signal) => Promise<readonly T[]>`, `debounceMs? = 150`, `getId`, `getLabel`, `getBadge?`, `label`, `hideLabel?`, `placeholder?`, `name?`, `postedValue? = 'id'` (`'id' \| 'query'`), `initialQuery?`, `onQueryChange?: (query) => void`, `onSelect?: (item) => void`, `emptyLabel? = 'No matches'`, `pendingLabel? = 'Searching…'`, `errorMessage?`, `id?`, `describedBy?`, `invalid?`, `required?`, `size?`, `inputClass?`, `portal? = true` + `HTMLAttributes<HTMLDivElement>` on the root | `item?(item)`, `footer?({ query, pending })`, `empty?({ query })` | bits-ui listbox ARIA; Enter with nothing highlighted lets a wrapping `<form>` submit |
| `FieldErrors` | The messages under one control | `errors: readonly string[]`, `id?` + `HTMLAttributes<HTMLDivElement>` | — | ONE `role="alert"` region holding one `<p>` per message; renders nothing while empty |

Which date control: `DateInput` (the native control, in the barrel) for a single date on a form; `DateField` / `TimeField` from `@thomasfosterau/components/dates` when the design needs the same control on every browser, or a time with a fixed 12/24-hour clock; `DatePicker` when the reader benefits from seeing the month but the field should stay compact, `Calendar` when the month should always show; `DateRangePicker` / `RangeCalendar` for a span. Their values are `DateValue`s: `parseDate('2026-10-23')` in, `value.toString()` out.

Which multi-choice control: `CheckboxGroup` when every option fits on screen (about seven or fewer), `MultiSelect` for a longer list, `Select` for a single native choice.

`Combobox` posts the selected id under `name` (a hidden input) by default. `postedValue="query"` makes it a search box instead: `name` goes on the visible input, so a plain `<form method="GET">` posts the typed text with JavaScript on or off, and Enter submits that form unless the reader moved to a suggestion with the arrow keys (clicking a suggestion still commits it, and `onSelect` receives it). `hideLabel` keeps `label` as the accessible name but renders it `sr-only`; `portal={false}` renders the listbox inside the component rather than in `<body>`, still floating.

```svelte
<form method="GET" action="/search" class="join">
  <Combobox
    label="Search" hideLabel name="query" postedValue="query" initialQuery={currentQuery}
    onSearch={suggest} getId={(hit) => hit.id} getLabel={(hit) => hit.title}
    inputClass="join-item" onSelect={(hit) => navigate(hit.href)}
  />
  <button type="submit" class="btn join-item">Search</button>
</form>
```

`fields` also exports `field-types.ts` (`FieldControl`, `FieldsetControl`, `FieldSize`, `FieldOption`, `FieldOptionInput`, `toFieldOptions`) and the daisyUI size tables (`inputSize`, `textareaSize`, `selectSize`, `checkboxSize`, `toggleSize`, `fileInputSize`, `rangeSize`, `pinCellSize`, `inputButtonSize`, each a `Record<FieldSize, string>`), and from `PushToggle` the `PushEnableResult` type (`{ _tag: 'enabled' | PushDeclineReason }`) and `PushDeclineReason` (`'unsupported' | 'unavailable' | 'denied'` — why `enable` did not subscribe, each with its own message prop).

```svelte
<script lang="ts">
  import { FormField, TextInput, Select, Textarea, CheckboxGroup, RadioGroup, Toggle, Combobox } from '@thomasfosterau/components';
</script>

<!-- One id becomes the label's `for`, the input's `aria-describedby`/`aria-invalid`, and the error region's id. -->
<FormField label="Scientific name" hint="Genus and species, as published." errors={nameErrors} required>
  {#snippet children(control)}<TextInput {...control} name="scientificName" bind:value={name} />{/snippet}
</FormField>

<FormField label="Rank">
  {#snippet children(control)}<Select {...control} options={['Family', 'Genus', 'Species']} bind:value={rank} />{/snippet}
</FormField>

<CheckboxGroup legend="Growing conditions" name="conditions" options={conditionOptions} bind:values={conditions} />

<!-- onChange may refuse: whatever it resolves to is written back, so a denied permission never leaves the switch reading "on". -->
<Toggle label="Notify this browser" checked={registered} onChange={(next) => (next ? registerPush() : unregisterPush())} />

<!-- Debounced, latest-wins, previous results stay on screen while the next are in flight. -->
<Combobox
  label="Taxon" name="taxonId" onSearch={searchTaxa}
  getId={(taxon) => taxon.id} getLabel={(taxon) => taxon.name} getBadge={(taxon) => taxon.rank}
  bind:value={taxonId}
/>
```

## forms

The parts of a form that are not one control. The split from `fields` is by who owns the message: a `FormErrors` message has no field to attach to, and a `FormActions` row belongs to the form rather than anything in it.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `FormErrors` | Whole-form messages | `messages?: readonly string[] \| undefined`, `tone? = 'error'`, `class?` | — | one `Alert live="assertive"` per message; renders nothing while the list is empty |
| `FormActions` | The submit / cancel row | `submitLabel? = 'Save'`, `pendingLabel? = 'Saving…'`, `pending?`, `disabled?`, `tone? = 'primary'`, `cancelHref?`, `cancelLabel? = 'Cancel'` + `HTMLAttributes<HTMLDivElement>` | `children?` (extra controls) | submit is real `type="submit"` (Enter in any field still submits); while `pending` it is `disabled` **and** `aria-busy="true"`, its label swaps, and it never loses its name |
| `SearchForm` | The site search box | `action`, `name? = 'q'`, `value ⚓`, `label? = 'Search'`, `submitLabel? = 'Search'`, `placeholder?`, `required? = true` + `HTMLFormAttributes` | — | `<search>` landmark around a GET form; label is visually hidden but real, never a placeholder |
| `HiddenField` | A fixed posted value | `name`, `value: string \| number` + `HTMLInputAttributes` | — | none, deliberately — not in the accessibility tree |

```svelte
<script lang="ts">
  import { FormActions, FormErrors, HiddenField, FormField, TextInput } from '@thomasfosterau/components';
</script>

<form method="post" action="/gardens/42/plants">
  <FormErrors messages={form?.errors?._errors} />
  <HiddenField name="gardenId" value={garden.id} />
  <FormField label="Plant name" errors={form?.errors?.name} required>
    {#snippet children(control)}<TextInput {...control} name="name" bind:value={name} />{/snippet}
  </FormField>
  <FormActions submitLabel="Add plant" pendingLabel="Adding…" pending={saving} cancelHref={`/gardens/${garden.id}`} />
</form>

<!-- A GET form on purpose: a search result should be a URL people can bookmark, share and go back to. -->
<SearchForm action="/search" name="query" label="Search the site" placeholder="Scientific or common name" />
```

## data

The tables, lists and pagers an index page and a detail page are built from. Two shapes run through it: **`Table` and `ItemList` present a window the caller already chose** (they never decide which rows exist, so a server-paged 40,000 rows is as easy as four). **`DataGrid` sorts, filters and pages a bounded set the page already holds, on the client**, composing the other two rather than duplicating them.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Table<T>` | Column-driven `table` over a window the caller chose | `rows`, `columns: TableColumn<T>[]`, `rowKey`, `caption?`, `captionHidden?`, `size?: Size`, `zebra?`, `pinRows?`, `sort? ⚓: SortState`, `onSort?`, `onSelect?(row)`, `emptyMessage? = 'Nothing to show.'`, `sortLabel?(column)`, `containerClass?` + `HTMLTableAttributes` | `emptyState?`, `foot?` | `<caption>` is the accessible name (`sr-only` when `captionHidden`); `<th scope="col">`; a `rowHeader` column's body cells are `<th scope="row">`; sortable header is a real `<button>`, `<th>` carries `aria-sort`; `onSelect` rows take `role="button"` + `tabindex="0"` + Enter/Space |
| `DataGrid<T>` | Client-side sort + filter + page over a bounded set | as `Table` plus `filterable?`, `paginated? = true`, `pageSize? = 10`, `pageSizeOptions?`, `filterLabel? = 'Search'`, `filterPlaceholder?`, `rowsPerPageLabel?`, `showingLabel?(start,end,total)`, `pageOfLabel?(page,pages)`, `previousLabel?`, `nextLabel?`, `paginationLabel?`, `locales?` | `emptyState?` | the `Table`'s and the `Pagination`'s combined |
| `MessageThread` | A conversation of `ChatBubble`s | `label`, `live? = false` | `children` | a `<section>` region named by `label` around an `<ol>`; `live` makes it `role="log"` (`aria-live="polite"`) for a thread that grows while it is read |
| `Pagination` | The one pager: numbered window or prev/next, links or callbacks | `offset`, `limit`, `total`, `variant?: 'window'\|'prevNext'`, `href?(offset)` **or** `onPage?(offset)`, `siblings? = 1`, `label? = 'Pagination'`, `previousLabel?`, `nextLabel?`, `pageLabel?(page)`, `formatPage?(page)` (visible digits; bare by default), `size?: Size`, `showRange?`, `rangeLabel?(start,end,total)`, `statusLabel?(page,pages)`, `locales?` | — | `<nav aria-label>`; `rel="prev"`/`rel="next"`; unavailable arm is an `aria-disabled` `<span>`, never a dead link |
| `ResultCount` | "Showing 24 of 4,310" under a windowed list | `shown`, `total`, `label?(shown,total)`, `locales?` | — | plain `<p>`, deliberately not a live region |
| `PaginationFooter` | `ResultCount` + `Pagination` from one set of numbers | `shown`, `offset`, `limit`, `total`, `href?`/`onPage?`, `variant?`, `siblings?`, `size?`, `label?`, `previousLabel?`, `nextLabel?`, `pageLabel?`, `formatPage?`, `countLabel?`, `locales?` | — | its two parts' |
| `ItemList<T>` | The list container, keying and empty state | `items`, `variant?: 'compact'\|'stacked'\|'grid'\|'cards'`, `getKey(item,index)`, `emptyMessage? = 'Nothing here yet.'`, `feed?`, `label?`, `busy?` | `item(item, index)`, `empty?` | default: `<ul>`/`<li>`; `feed`: `<div role="feed" aria-label aria-busy>` of `<article aria-posinset aria-setsize tabindex="-1">` |
| `LinkListItem` | The common row body | `href`, `title`, `subtitle?`, `badges?`, `headingLevel?` | `meta?` | the title is the row's only interactive element |
| `ChatBubble` | One attributed, timed message | `author`, `sentAt?`, `side? = 'start'` (`'end'` for the viewer's own), `tone?`, `relative? = false`, `locales?` | `children`, `avatar?`, `footer?` | an `<li>` holding an `<article>` named by its header ("Ada Lovelace, 3 minutes ago"); the time is a `<time datetime>` (`DateTime` or `RelativeTime`); the avatar is `aria-hidden`; `side` and `tone` are visual only |
| `DescriptionList` | `<dl>` of label/value pairs in four shapes, or `bare` in the caller's own layout | `variant?: 'grid'\|'card'\|'divided'\|'inline'\|'bare'`, `mono?`, `showEmpty?`, `emptyLabel? = 'unrecorded'` | `children` | a real `<dl>`; in `card` and `bare` every `<dt>`/`<dd>` is a direct child of it, and `bare` adds no classes beyond the caller's `class` |
| `DescriptionRow` | One pair inside it | `label`, `value?` **or** `children`, `valueClass?`, `labelClass?`, `showEmpty?`, `emptyLabel?` | `children?` | `<dt>`/`<dd>`; a row with nothing renders **nothing** (or `emptyLabel` when `showEmpty`) |
| `TreeList` | One collapsible node of a hierarchy | `open? ⚓ = true`, `title: string \| Snippet` | `title?`, `children?` | native `<details>`/`<summary>` inside `<ul>`/`<li>`; deliberately **not** `role="tree"` |
| `TreeListItem` | One leaf under it | — | `children?` | a plain `<li>` |
| `DiffText` | A word- or character-level diff inline | `segments: DiffSegment[]`, `separator? = ' '`, `insertLabel?`, `deleteLabel?` | — | `<ins>`/`<del>` carry the meaning; colour and strike-through are the second copy, never the only one |

`data` also exports `pageWindow`, `pageHref`, `nextSortState`, `columnAriaSort`, and the types `TableColumn`, `SortState`, `LinkListItemData`, `DiffSegment`. `pageHref(base, page, names?)` writes the position into `base`'s query, preserving every other parameter and the hash (JSON:API's `page[offset]`/`page[limit]` by default, exported as `PAGE_OFFSET_PARAM` / `PAGE_LIMIT_PARAM`; `names: PageParamNames` — `{ offset?, limit? }` — renames them) — the callback shape a filtered list's pager needs so its own filter survives. `pageWindow(page, total, siblings = 1): PageWindow` is the arithmetic `Pagination` draws: `{ page, pageCount, from, to, previous, next, items }`, page numbers 1-based, `previous` / `next` the neighbouring offsets (`undefined` at either end), and `items` a `readonly PageWindowItem[]` of `{ kind: 'page', page, offset, current }` and `{ kind: 'gap', after }` entries.

`DescriptionList` hands its presentation to its rows through context: `DescriptionListStyle` is `{ variant, mono, showEmpty, emptyLabel }`, `setDescriptionListStyle(() => style)` / `getDescriptionListStyle()` set and read it, and `defaultDescriptionListStyle` (`grid`, not mono, empty rows hidden, `'unrecorded'`) is what a `DescriptionRow` uses outside any list.

```svelte
<script lang="ts">
  import { Table, DataGrid, PaginationFooter, pageHref, ItemList, LinkListItem, DescriptionList, DescriptionRow, ExternalLink, type SortState, type TableColumn } from '@thomasfosterau/components';

  let sort = $state<SortState | undefined>({ key: 'name', direction: 'asc' });
  const columns: readonly TableColumn<Plant>[] = [
    { key: 'name', header: 'Plant', value: (p) => p.name, sortable: true },
    { key: 'family', header: 'Family', value: (p) => p.family },
  ];
  const href = (offset: number) => pageHref(page.url.search === '' ? '/plants' : `/plants${page.url.search}`, { offset, limit });
</script>

<Table rows={plants} {columns} rowKey={(p) => p.id} caption="Everything sown this season" bind:sort onSort={reload} />

<!-- A bounded set the page already holds — so the grid does the work. -->
<DataGrid rows={devices} {columns} rowKey={(d) => d.id} filterable pageSize={10} caption="Your devices" />

<PaginationFooter shown={plants.length} {offset} {limit} total={meta.totalCount} {href} />

<ItemList items={gardens} variant="cards" getKey={(g) => g.id} emptyMessage="No gardens yet.">
  {#snippet item(garden)}<LinkListItem href={garden.href} title={garden.title} subtitle={garden.subtitle} />{/snippet}
</ItemList>

<DescriptionList variant="card">
  <DescriptionRow label="Captured"><DateTime value={media.capturedAt} dateStyle="long" /></DescriptionRow>
  <!-- No licence recorded? The row is simply not there. -->
  <DescriptionRow label="Licence">{#if media.licence}<Link href={media.licence.href}>{media.licence.name}</Link>{/if}</DescriptionRow>
</DescriptionList>

<!-- `bare`: the page owns the grid; rows and its own pairs share the two columns. -->
<DescriptionList variant="bare" class="grid grid-cols-[auto_1fr] gap-x-4">
  <dt>Name</dt><dd>{organisation.name}</dd>
  <DescriptionRow label="Website"><ExternalLink href={organisation.website}>{organisation.website}</ExternalLink></DescriptionRow>
</DescriptionList>
```

## infobox

One family, two ways to fill it. Composed primitives (`InfoboxHeader`, `InfoboxImage`, `InfoboxSection`, `InfoboxRow`) let a page build bespoke markup; a typed `rows` convenience on `Infobox` itself lets a page instead hand over a `$derived<InfoboxRowSpec[]>` built from sparse entity attributes — both render through the same primitives, so a fix to row layout lands once.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Infobox` | The summary rail frame | `title?`, `subtitle?`, `headingLevel? = 3` (`2`–`6`, forwarded to `InfoboxHeader`), `label='Key facts'`, `image?: InfoboxImageSpec`, `rows?: readonly InfoboxRowSpec[]`, `float?` + `HTMLAttributes<HTMLElement>` | `children?` (extra composed markup, rendered after `rows`) | `<aside aria-label={title ?? label}>` |
| `InfoboxHeader` | The title block | `title`, `subtitle?`, `headingLevel? = 3` (`2`–`6`) + `HTMLAttributes<HTMLDivElement>` | — | `<h3>` by default, deliberately outside the document outline; raise `headingLevel` to the page's section level when the box is a section in its own right |
| `InfoboxImage` | The identifying picture | `src`, `alt`, `caption?`, `width?`, `height?`, `eager?` | — | `<figure>`/`<img>`/`<figcaption>`; default lazy |
| `InfoboxSection` | A titled group of rows | `title?` + `HTMLAttributes<HTMLDListElement>` | `children` (the rows) | owns the `<dl>` |
| `InfoboxRow` | One label/value pair | `label`, `value?: string \| number`, `href?` (through the components context), `external?`, `emptyLabel='unrecorded'`, `showEmpty?` + `HTMLAttributes<HTMLDivElement>` | `children?` (wins over `value`) | `<dt>`/`<dd>` pair; **empty by default** — `showEmpty` opts into an em dash captioned by `aria-label={emptyLabel}` |

`InfoboxRowSpec` is a discriminated union on `kind`, and each member is exported on its own:

| Type | Shape | Skipped when |
| --- | --- | --- |
| `InfoboxFactRow` | `{ kind: 'fact', label, value: string \| number \| undefined }` — one identifying fact | `value` is `undefined` or `''` |
| `InfoboxLinkRow` | `{ kind: 'link', label, text, href: string \| undefined, external? }` — one named link with its own visible text | `href` is `undefined` or `''` |
| `InfoboxLinksRow` | `{ kind: 'links', label, links: readonly InfoboxLinkEntry[] \| undefined }` — a relationship rendered as several links (`InfoboxLinkEntry` is `{ label, href }`) | `links` is `undefined` or empty |
| `InfoboxImageRow` | `{ kind: 'image', ...InfoboxImageSpec }` — the identifying picture, rendered above the `<dl>` as an `InfoboxImage` | `src` is `''` |
| `InfoboxCustomRow` | `{ kind: 'custom', label, content: Snippet<[]> }` — arbitrary markup as the value | never |

`InfoboxImageSpec` (`{ src, alt, caption?, width?, height?, eager? }`) is also what `Infobox`'s `image` prop takes. `infoboxRowIsPresent(row): boolean` is the "skipped when" column as a function — the one definition of an empty row that `Infobox` filters `rows` with.

```svelte
<script lang="ts">
  import { Infobox, InfoboxSection, InfoboxRow, type InfoboxRowSpec } from '@thomasfosterau/components';
</script>

<!-- Composed. -->
<Infobox title="Solanum lycopersicum" subtitle="Tomato">
  <InfoboxSection title="Classification">
    <InfoboxRow label="Family" value="Solanaceae" />
    <InfoboxRow label="Genus" href="/taxa/solanum" value="Solanum" />
    <!-- Renders nothing at all — the row is simply absent. -->
    <InfoboxRow label="Frost tolerance" />
  </InfoboxSection>
</Infobox>

<!-- Typed rows — same primitives, one array. -->
<script lang="ts">
  const rows: InfoboxRowSpec[] = [
    { kind: 'image', src: taxon.imageUrl, alt: taxon.name, eager: true },
    { kind: 'fact', label: 'Family', value: taxon.family },
    { kind: 'links', label: 'Synonyms', links: taxon.synonyms.map((s) => ({ label: s.name, href: s.href })) },
  ];
</script>
<Infobox title={taxon.name} {rows} />
```

## formatting

Locale-aware rendering of dates, numbers, lists, relative time and search-result highlighting. Every `Intl` constructor reads `locales`, then falls back to `getComponentsContext().locale()`.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `DateTime` | `<time>` with an ISO `datetime` and `Intl.DateTimeFormat` text | `value: Date \| number \| string`, `locales?`, `dateStyle? = 'medium'`, `timeStyle?`, `options?: Intl.DateTimeFormatOptions` (wins over the styles) | `children?` — replaces the text; `datetime` stays machine-readable | native `<time>` semantics only |
| `Duration` | A length of time: "2 hr, 30 min" | `value: DurationValue \| number` (ms), `style? = 'short'` (`'long'\|'short'\|'narrow'\|'digital'`), `locales?` | — | `<time datetime="PT2H30M">`; `Intl.DurationFormat`, with a localised `NumberFormat` + `ListFormat` fallback; `formatDuration`, `durationFromMilliseconds` and `toIsoDuration` are exported for plain TypeScript |
| `NumberFormat` (also exported as `Number`; `NumberFormat` is primary, since a `Number` export would shadow the global) | `<data>` with a raw `value` attribute and `Intl.NumberFormat` text | `value: number \| bigint`, `locales?`, `style?`, `unit?`, `unitDisplay?`, `currency?`, `currencyDisplay?`, `maximumFractionDigits?`, `minimumFractionDigits?`, `signDisplay?`, `notation?`, `options?: Intl.NumberFormatOptions` (wins) | — | native `<data>` semantics only |
| `FormatList<T>` | Renders items through `Intl.ListFormat.formatToParts`, so conjunction/disjunction text ("and", ", ") comes from the runtime | `items: readonly T[]`, `style? = 'long'`, `type? = 'conjunction'`, `locales?` | `children(item: T)` | no wrapper element |
| `Countdown` | Time left until an instant, ticking every second | `until`, `label`, `largestUnit? = 'days'` (`'days'\|'hours'\|'minutes'`), `display? = 'digits'` (`'digits'\|'text'`), `completeLabel? = 'Time is up'`, `onComplete?`, `locales?` | — | `role="timer"` named by `label`; the ticking digits are `aria-hidden` and the spoken text is coarse (whole minutes under an hour, whole hours above); a `role="status"` announces `completeLabel` once at zero; no digit animation under reduced motion; an `until` already past is complete without calling `onComplete` |
| `RelativeTime` | "3 hours ago" / "in 2 days" via `Intl.RelativeTimeFormat`, picking the largest unit whose magnitude rounds to ≥ 1 | `value: Date \| number \| string`, `now?` (pin it in tests), `locales?`, `numeric? = 'auto'`, `style? = 'long'` | — | `<time datetime=ISO title=absolute>` — the absolute instant is never hidden |
| `Year` | `<time>` with just a year — `datetime="1925"` — and its `Intl.DateTimeFormat` rendering | `value: Date \| number \| string` (a number is a calendar year; an instant contributes its UTC year), `locales?`, `era?`, `representation? = 'numeric'` (`'2-digit'`) | — | native `<time>`; `datetime` is a valid HTML year string (ISO instant before 1 CE) |
| `Highlight` (+ exported `tokenise(text, query): { text, match }[]`, the segmentation it renders) | Best-effort client-side token highlight for search results | `text: string`, `query: string` | — | `<mark>` per matched token; naive — a UX nicety, not the authoritative FTS match |

```svelte
<DateTime value={post.publishedAt} dateStyle="long" />
<NumberFormat value={price} style="currency" currency="AUD" />
<p><FormatList items={tags}>{#snippet children(tag)}<Badge>{tag}</Badge>{/snippet}</FormatList></p>
<RelativeTime value={comment.createdAt} />
<Year value={book.yearPublished} itemprop="datePublished" />
<p><Highlight text={result.title} query={searchQuery} /></p>
```

## links

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `EmailLink` | A `mailto:` anchor whose query string is built with `URLSearchParams`, so every value is correctly encoded | `email: string`, `subject?`, `body?`, `cc?`, `bcc?`, `class` merged last, spreads `HTMLAnchorAttributes` | `children?` — replaces the link text; defaults to the address | native `<a>` — visible text is the accessible name |
| `ContextLinks` | The "About: X, Y" row under a piece of content. Renders nothing for an empty list | `links: readonly ContextLinkItem[]` (`{ href, label }`; each `href` resolved through the context), `label? = 'About'`, `class` merged last, spreads `HTMLAttributes<HTMLParagraphElement>` | — | a paragraph of links; each link's text is its name |

```svelte
<EmailLink email="hello@thomasfoster.au" subject="Question about your garden">
  {#snippet children()}Contact us{/snippet}
</EmailLink>
<ContextLinks links={[{ href: `/taxa/${taxon.id}`, label: taxon.name }]} />
```

## media

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Image` | Responsive `<img>`, optionally wrapped in `<picture>` | `alt: string` (required, no default), `src?` **or** `id?` + `base? = '/images'` + `widths? = [320,640,960,1280,1920]` (bucketed `srcset`), `sources?: { srcset, type?, media? }[]` (→ `<picture>`), `width?`, `height?`, `sizes? = '100vw'`, `eager? = false`, `decoding? = 'async'`; spreads `HTMLImgAttributes` | — | `alt` is required and undefaulted — an intentionally decorative image passes `alt=""` explicitly |
| `Video` | Player for an HLS-served video (Cloudflare Stream shape) | `hlsUrl?`, `posterUrl?`, `title: string` (accessible name), `width?`, `height?`, `uploadState? = 'ready'` (`'pending'\|'processing'\|'ready'\|'failed'`), `statusLabel?`, `onReady?: (el: HTMLVideoElement) => void`, `captionsSrc?` | — | `title` → `aria-label` on `<video>`; a non-playable placeholder's `statusLabel` is visible text, not colour alone |
| `Figure` | `<figure>` with an optional `<figcaption>` | `caption?: string \| Snippet<[]>`, spreads `HTMLAttributes<HTMLElement>`, `class` merged last | `children` (required), `caption` (when a snippet) | native `<figure>`/`<figcaption>` association |

```svelte
<Image id={photo.id} alt="Tomato seedlings in early spring" width={1280} height={720} />
<Video hlsUrl={video.hlsUrl} posterUrl={video.posterUrl} title="Spring garden tour" onReady={attachHlsJs} />
<Figure caption="A row of tomato seedlings"><img src={photo.src} alt="Tomato seedlings" /></Figure>
```

`imageDimensions(file: Blob): Promise<ImageDimensions>` (`ImageDimensions` is `{ width, height }`, in pixels) reads an image file's intrinsic pixel size with `createImageBitmap`, in the browser, so an upload form can submit `width` / `height` with the binary (it is what `ImageInput` measures with). It rejects with `ImageDimensionsUnavailable` where there is no `createImageBitmap` (on a server), and with the browser's own error for a file that does not decode.

## hotkeys

One registry answers "what can the viewer do right now"; `HotkeyProvider` matches keystrokes against it, `HotkeyHelpDialog` lists what carries a trigger, and `search`'s `CommandPalette` lists what is palette-visible. An app creates the registry in its root layout, renders `HotkeyProvider` once, and registers actions from anywhere below — global ones from the layout, page ones from the page, torn down on unmount.

The family is also its own entry, `@thomasfosterau/components/hotkeys`. Import `HotkeyHelpDialog` from it dynamically (`const { HotkeyHelpDialog } = await import('@thomasfosterau/components/hotkeys')`) to keep the dialog out of your entry chunk until the first `?`.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `HotkeyProvider` | The single global `keydown` listener: chords, sequences, the editable guard | — (reads the registry from context) | — | renders nothing. Its obligation is negative — it never steals a keystroke from a control that needs one. While focus is in an editable target, or while `paletteOpen`/`helpOpen` is set, only `allowInEditable` actions fire |
| `HotkeyBadge` | A trigger as `kbd` chips | `trigger: HotkeyTrigger`, `commandLabel? = '⌘'`, `controlLabel? = 'Ctrl'`, `thenLabel? = 'then'` + `HTMLAttributes<HTMLSpanElement>` | — | `<kbd>` per key; `$mod` renders as `controlLabel` on the server and resolves per platform after mount |
| `HotkeyHelpDialog` | The overlay listing every live hotkey, opened by an action you register (conventionally `?`) | `title? = 'Keyboard shortcuts'`, `closeLabel? = 'Close'`, `emptyLabel? = 'No keyboard shortcuts are available on this page.'`, `groupLabels? = { page: 'This page', global: 'Everywhere' }`, `commandLabel?`, `controlLabel?`, `thenLabel?` | — | this library's `Dialog`; each scope is a `<section>` with a heading over a `<ul>`. Opened/closed through the registry's `helpOpen` |

| Export | What it is |
| --- | --- |
| `createHotkeyRegistry(options: HotkeyRegistryOptions): HotkeyRegistry` | Creates the registry and puts it in context. Call once, from the root layout, during component initialisation. |
| `HotkeyRegistryOptions` | `{ isAdmin: () => boolean, dev?: boolean }`. `isAdmin` is a function, so the gate is reactive; with `dev` set, registering a trigger that shadows an existing one logs a console warning (wire it to your bundler's dev flag). |
| `getHotkeyRegistry()` / `tryGetHotkeyRegistry()` | Read it back; the first throws `HotkeyRegistryMissing` (an `Error` subclass) when no registry was created above, the second returns `undefined` instead — the seam `CommandPalette` uses to work with no registry. |
| `registerHotkeys(() => actions, { scope? })` | Declarative registration for the calling component's lifetime; `scope` defaults to `'page'`. The thunk is reactive: when what it reads changes, the batch is replaced. |
| `HotkeyRegistry` | The class `createHotkeyRegistry` returns. `paletteOpen` and `helpOpen` are writable `$state` flags (what a palette or help action toggles); `active` (role-filtered, match-precedence order: page before global, later registrations first), `paletteActions` (palette-visible, registration order) and `hotkeys` (those with a trigger, registration order) are read-only `RegisteredAction[]`s; `register(scope, actions)` returns its unregister function. An action with `requiresAdmin` is absent from all three for a viewer `isAdmin()` rejects. |
| `CommandAction` | One registered action: `{ id, label, group: CommandActionGroup, run: () => void \| Promise<void>, trigger?: HotkeyTrigger, requiresAdmin?, paletteVisible?, allowInEditable? }`. No `trigger` makes it palette-only; `paletteVisible: false` makes it hotkey-only; `allowInEditable` lets it fire while focus is in an input (reserve it for the palette opener). |
| `CommandActionGroup` | `'actions' \| 'navigation'` — the palette section an action is listed under. |
| `HotkeyScope` | `'global' \| 'page'`. Page registrations are torn down with their page and win trigger conflicts over global ones. |
| `RegisteredAction` | `{ scope, action }` — what the registry's read surfaces return. |
| `HotkeyTrigger` | `HotkeyChord \| HotkeySequence`. A **chord** (`HotkeyChord`, a string such as `'$mod+k'`) is `+`-separated modifiers (`$mod`, `alt`, `shift`) and a key held together, `$mod` being ⌘ on Apple platforms and Ctrl elsewhere; a **sequence** (`HotkeySequence`, `readonly string[]` such as `['g', 'p']`) is plain keys pressed in order, buffered for `SEQUENCE_TIMEOUT_MS` (1000). A string without `+` (`'e'`, `'?'`) is a one-key sequence. Shift is never written for a shifted character: `'?'` already arrives as `?`. |

The matching rules `HotkeyProvider` runs are exported as pure functions, for a caller building its own listener or testing its triggers:

| Function | What it does |
| --- | --- |
| `matchChord(event, actions): CommandAction \| undefined` | The first action whose chord trigger matches the event. `actions` must already be in precedence order (`registry.active` is). The other platform's modifier must not be held, so Ctrl+K on a Mac does not fire `$mod+k`. |
| `matchSequence(buffer, actions): SequenceMatch` | Matches a buffer of keys against every plain-key trigger. `SequenceMatch` is `{ exact: CommandAction \| undefined, isPrefix: boolean }` — the first action the buffer completes, and whether the buffer could still grow into a longer sequence. |
| `isSequenceKey(event): boolean` | Whether the key can join a sequence: one printable character, no ⌘ / Ctrl / Alt. |
| `hasChordModifier(event): boolean` | Whether ⌘, Ctrl or Alt is held. |
| `isEditableTarget(target): boolean` | Whether the target is an `input`, `textarea`, `select` or contenteditable element — where only `allowInEditable` actions fire. |
| `isApplePlatform(): boolean` | Whether `$mod` means ⌘ here (`navigator.platform` is a Mac or iOS device); `false` where there is no `navigator`. |
| `triggerDisplay(trigger): TriggerDisplay` | The trigger as `HotkeyBadge` renders it: `TriggerDisplay` is `{ keys: readonly string[], sequential: boolean }`, keys upper-cased except `'$mod'`, which is left for the renderer to resolve per platform. |

```svelte
<!-- Root layout, once. -->
<script lang="ts">
  import { createHotkeyRegistry, registerHotkeys, HotkeyProvider, HotkeyHelpDialog, CommandPalette } from '@thomasfosterau/components';

  const hotkeys = createHotkeyRegistry({ isAdmin: () => user?.isAdmin === true, dev });
  registerHotkeys(() => [
    { id: 'palette.toggle', label: 'Open the command palette', group: 'actions', trigger: '$mod+k', allowInEditable: true, paletteVisible: false, run: () => { hotkeys.paletteOpen = !hotkeys.paletteOpen; } },
    { id: 'help.toggle', label: 'Show keyboard shortcuts', group: 'actions', trigger: '?', run: () => { hotkeys.helpOpen = !hotkeys.helpOpen; } },
    { id: 'nav.plants', label: 'Go to plants', group: 'navigation', trigger: ['g', 'p'], run: () => goto('/plants') },
  ], { scope: 'global' });
</script>

<HotkeyProvider />
<HotkeyHelpDialog />
<CommandPalette />
```

```svelte
<!-- A page, contributing its own actions for as long as it is mounted. -->
<script lang="ts">
  import { registerHotkeys } from '@thomasfosterau/components';
  registerHotkeys(() => bed.canEdit ? [{ id: 'bed.edit', label: 'Edit this bed', group: 'actions', trigger: 'e', run: () => goto(`/beds/${bed.id}/edit`) }] : []);
</script>
```

## search

One component, because a palette is one thing: a dialog, a query box, and rows from wherever the app has them. It composes this library's `Dialog` with bits-ui's `Command`, taking rows from up to three places at once — a mounted hotkey registry's `paletteActions`, a static `items` prop, and an asynchronous `onSearch` — none required.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `CommandPalette` | The ⌘K palette: actions, navigation and search results in one list | `open? ⚓` (two-way bound to the registry's `paletteOpen` when a registry exists), `label? = 'Command palette'`, `placeholder? = 'Type a command or search…'`, `loadingLabel? = 'Searching…'`, `emptyLabel? = 'No results'`, `closeLabel? = 'Close'`, `groups? = defaultCommandGroups` (`readonly CommandGroup[]`), `items?: readonly CommandItem[]`, `onSearch?: (query, signal) => Promise<readonly CommandItem[]>`, `debounceMs? = 150`, `onSelect?: (item) => void` | `item?(item)` | `Dialog`'s plus `Command`'s: the input is a `combobox` owning a `listbox`, each row an `option`, `aria-activedescendant` follows the arrow keys. The pending row is a `progressbar` named by `loadingLabel` |

`onSearch` follows the same debounce / latest-wins (`AbortController`) / stale-while-revalidate rules as `fields/Combobox`. `CommandItem` is `{ id, label, group, hint?, badge?, run?, href? }`; activation closes the palette, calls `onSelect`, then `run`, then navigates to `href` through the components context. A row's `group` names a `CommandGroup` — `{ id, label }`, a section and its heading — and `groups` sets which sections render, in order; a row whose `group` is not listed there is not shown. `defaultCommandGroups` is `[{ id: 'actions', label: 'Actions' }, { id: 'navigation', label: 'Go to' }, { id: 'results', label: 'Results' }]`: the registry's two `CommandActionGroup`s, then a `results` section for `onSearch` rows. Pass your own array to rename or translate the headings.

```svelte
<!-- With a hotkey registry mounted, no props are needed at all. -->
<CommandPalette />
```

```svelte
<script lang="ts">
  import { CommandPalette, type CommandItem } from '@thomasfosterau/components';

  const items: readonly CommandItem[] = [
    { id: 'bed.create', label: 'New bed', group: 'actions', run: () => goto('/beds/new') },
  ];
  const onSearch = async (query: string, signal: AbortSignal): Promise<readonly CommandItem[]> => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
    return (await response.json()).map((row) => ({ id: row.id, label: row.name, group: 'results', href: `/plants/${row.id}` }));
  };
</script>

<CommandPalette bind:open {items} {onSearch} />
```

## citations

`@thomasfosterau/components/citations`. A page's `Citation` and `Footnote` markers register into a shared `BibliographyManager` (provided by `setupBibliography`); `ReferenceList` and `FootnoteList` render what accumulated. `CreditList` renders a locale-joined byline for one role.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Citation` | An inline reference marker; registers its source and renders the number it was given | `citation: CitationData`, `format? = 'superscript'` (`'inline'`), `linkToReference? = true`, `referenceLabel? = (n, title) => \`Reference ${n}: ${title}\`` | — | the marker's accessible name comes from `referenceLabel`; a real `<a>` when `linkToReference`, otherwise a `<span>` |
| `Footnote` | An inline note marker, tracked separately from citations | `id: string`, `content: string`, `symbol?: string`, `footnoteLabel? = (marker, content) => \`Footnote ${marker}: ${content}\`` | — | accessible name from `footnoteLabel` on the `<a href="#footnote-<id>">` |
| `ReferenceList` | The numbered bibliography a page's `Citation`s accumulated, in citation order. Renders nothing until something has been cited | `title? = 'References'`, `showTitle? = true`, `headingLevel? = 2` | — | a real heading; each entry anchors `#ref-<id>` |
| `FootnoteList` | The notes a page's `Footnote`s accumulated. Renders nothing until something has been noted | `title? = 'Notes'`, `showTitle? = true`, `headingLevel? = 2` | — | a real heading; each entry anchors `#footnote-<id>` |
| `CreditList` | A locale-joined byline for one role — authors, editors, translators, or a caller's own. Renders nothing for an empty list | `credits: readonly Credit[]`, `role? = 'author'` (`'editor'\|'translator'\|string`), `roleLabel?: (count) => string`, `roleLabelPosition?: 'before'\|'after'`, `itemprop?`, `locales?`, `style?`, `type?`, `class?` | — | Schema.org microdata (`itemprop`, `itemscope`, `itemtype`) per resolved credit |
| `DOILink` | A DOI as a resolvable `https://doi.org/<doi>` link | `doi: string`, `itemprop?`, `children?` (defaults to the bare DOI), plus native anchor attributes | `children?` | `target="_blank" rel="noreferrer"` |
| `ISBNLink` | An ISBN as a resolvable WorldCat lookup link | `isbn: string`, `itemprop?`, `children?`, plus native anchor attributes | `children?` | as `DOILink` |
| `ISSNLink` | An ISSN as a resolvable WorldCat lookup link | `issn: string`, `itemprop?`, `children?`, plus native anchor attributes | `children?` | as `DOILink` |
| `BookCitation` | A book as a compact author–date reference: "Authors, _Title_ editors translators (3rd edition: 1969) _Series_ Place: Publisher pp 304 available online at … ISBN" | `book: BookRecord`, `itemprop?`, `untitledLabel? = 'Untitled book'`, `noDateLabel? = 'no date'`, `editionLabel? = (e) => \`${e} edition\``, `pageCountLabel? = 'pp'`, `availableOnlineLabel? = 'available online at'`, `locales?` | — | Schema.org `Book` microdata; contributors through `CreditList`, in credit order |
| `ChapterCitation` | "Authors, 'Chapter', in `BookCitation` ch 4 (pp 101–130)" — the containing book nested under `isPartOf` when the record carries it | `chapter: ChapterRecord`, `untitledLabel? = 'Untitled chapter'`, `inLabel? = 'in'`, `chapterLabel? = 'ch'`, `pageLabel? = 'p'`, `pagesLabel? = 'pp'`, `bookLabels?` (forwarded), `locales?` | — | Schema.org `Chapter` microdata |
| `ScholarlyArticleCitation` | "Authors, 'Title' (2019) _Periodical_ 12 (3) pp 45–67 DOI ISSN" | `article: ScholarlyArticleRecord`, `itemid?`, `untitledLabel? = 'Untitled article'`, `noDateLabel?`, `pageLabel?`, `pagesLabel?`, `availableOnlineLabel?`, `locales?` | — | `ScholarlyArticle` → `PublicationIssue` → `PublicationVolume` → `Periodical` microdata |
| `ThesisCitation` | "Author, _Title_ (2019) PhD thesis, Institution" | `thesis: ThesisRecord`, `untitledLabel? = 'Untitled thesis'`, `degreeLabel? = (d) => d ? \`${d} thesis\` : 'thesis'`, `availableOnlineLabel?`, `locales?` | — | Schema.org `Thesis`; the institution is `sourceOrganization` |
| `ReportCitation` | "Authors, _Title_ editors translators (2021) Place: Publisher pp 88" | `report: ReportRecord`, `itemid?`, `untitledLabel? = 'Untitled report'`, `noDateLabel?`, `pageCountLabel?`, `availableOnlineLabel?`, `locales?` | — | Schema.org `Report` microdata |
| `Publisher` | "Place: Name" — a publisher or awarding institution | `publisher: PublisherRecord` (`{ name, itemtype? = 'Organization', address?: { locality?, region?, country? } }`), `itemprop? = 'publisher'` | — | `Person` / `Organization` with a `PostalAddress` of the present parts |

**The CSL-type records are local.** `BookRecord`, `ChapterRecord`, `ScholarlyArticleRecord`, `ThesisRecord`, `ReportRecord`, `PublisherRecord` and `CitationDate` are defined in this package for now, because the bibliographic model they will align with, `@thomasfosterau/biblio`, is not published yet. Contributors are resolved `Credit`s in credit order, not linkage. An app maps its resources onto these shapes at its own seam. The JSON:API `included` resolver belongs to effect-jsonapi's client helpers, not here.

`formatCitation`, `BibliographyManager`, `setupBibliography`, `getBibliographyContext`, and the `CitationData`/`CitationKind`/`FootnoteData`/`Credit` types are also exported. (`Citation` and `Footnote` name the components; the data shapes are `CitationData`/`FootnoteData` to avoid a value/type collision.) `BibliographyManager.citations()` returns `readonly BibliographyEntry[]` — `{ citation: CitationData, order }`, one per distinct source in first-cited order, `order` being the number its markers show. `CreditedRecord` (`{ authors?, editors?, translators? }`, each a `readonly Credit[]` in credit order, never re-sorted) is the contributor shape every CSL record above extends.

```svelte
<script lang="ts">
  import { Citation, Footnote, ReferenceList, FootnoteList, setupBibliography, CreditList } from '@thomasfosterau/components/citations';

  setupBibliography(); // once, high in the page
  const revision = { id: 'revision', kind: 'article', title: 'A revision of Rosa section Caninae', authors: ['Smith, J.'], year: 1998, container: 'Australian Systematic Botany' };
</script>

<p><em>Rosa canina</em> is circumscribed narrowly here<Citation citation={revision} />.</p>
<ReferenceList />

<!-- "Smith, J. and Jones, A." -->
<CreditList role="author" credits={[{ name: 'Smith, J.', href: '/people/smith-j', itemtype: 'Person' }, { name: 'Jones, A.' }]} />
```

A `Citation` or `Footnote` rendered with no `setupBibliography()` provider above it still works — `getBibliographyContext()` falls back to a fresh, standalone manager rather than throwing.

## entity-form

`@thomasfosterau/components/entity-form`. The renderer for [`@thomasfosterau/effect-forms-svelte`](https://github.com/thomasfosterau/effect-forms)'s `defineEntityForm` definitions. It is the only entry point that reaches Effect, so it is kept separate and its form library is an optional peer: `pnpm add @thomasfosterau/effect-forms-svelte effect` if you use it.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `EntityForm` | Walks `definition.entriesFor(mode)` in declaration order. Scalar entries render as `FormField` + `TextInput` (`url` / numeric `inputmode`), `DateInput` (`type: 'date'`) or `Textarea` (multiline). Select entries render as `Select` over the field's derived enum values. Widget entries render the entry's own component through the bridge | `definition: EntityFormDefinition`, `mode: 'create' \| 'update'`, `cancelHref?`, `action?` (a named action), `initial?: Record<string, string>` (seeded once, at mount, so it lands in SSR HTML), `initialRows?` (per `rows` widget), `fieldProps?` (per widget key), `enhance?: (form) => attributes` (default: the store's own `form.props`), `cancelLabel? = 'Cancel'`, `pendingLabel? = 'Saving…'`, `selectPlaceholder? = 'Choose…'`, `requiredLabel?`, `messages?: readonly string[]` (form-level messages from outside the store, e.g. `page.form?.message`; rendered after the store's root errors), plus native `<form>` attributes | — | each control is labelled by its `FormField`. Errors are `aria-describedby`. Root errors and `messages` are `FormErrors` alerts, one `role="alert"` each |

Field labels, submit labels and option labels come from the definition's own message thunks. Every other string is a prop.

**The widget bridge.** A `custom` or `rows` widget receives its definition's `props()`, then your `fieldProps[key]`, then `name` / `value` / `onChange` / `errors`, in that order. The bridge goes last, so neither of the first two can sever the store binding. A `custom` widget bridges a string field of the store. A `rows` widget bridges a row list held by the renderer and serialises it itself. A `gate: true` widget disables submit while its value is empty. A create form whose command carries a client id gets a `crypto.randomUUID()` minted once per mount, so a retried submission stays idempotent.

**SvelteKit.** This package cannot import `$app/forms`, so pass your app's `enhanceForm` (the `$app/forms`-backed spreadable attributes, which effect-forms#2 moves into `@thomasfosterau/effect-forms-svelte/kit`):

```svelte
<script lang="ts">
  import { EntityForm } from '@thomasfosterau/components/entity-form';
  import { enhanceForm } from '$lib/effect-form';
  import { bookForm } from '$lib/entity-forms/book';

  let { data } = $props();
</script>

<EntityForm definition={bookForm} mode="update" initial={data.initial} cancelHref={`/books/${data.id}`} enhance={enhanceForm} />
```

## seo

`@thomasfosterau/components/seo`. Per-page `<head>` metadata and structured data. Both components render only into `<svelte:head>` — nothing in the body.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Head` | Title (with a site-name suffix), description, keywords, robots, canonical URL, `hreflang` alternates, a feed link, Open Graph + Twitter / X tags, share image, `article:*`, `prev` / `next` | `title: string`, `siteName?`, `titleSeparator? = ' \| '`, `description?`, `keywords?`, `type?: SchemaPageType` (derives `og:type`), `openGraphType?: OpenGraphType`, `canonical?`, `pathname?` (defaults to `window.location.pathname`; pass `page.url.pathname` for SSR), `canonicalHref?` (defaults to the context `href`), `alternates?: AlternateLink[]` or `locales?` (`alternates` wins), `ogLocale?` (defaults to the context locale, `-` → `_`), `feed?: FeedLink`, `robots?: Robots`, `image?: HeadImage` → `shareCard?: OgImageCard` → `defaultImage?: HeadImage` (precedence), `shareCardPath? = '/og'`, `shareCardAlt?: (card) => string` (default `"<card title> — <siteName>"`, the title alone without a `siteName`), `published?`, `modified?`, `section?`, `tags?`, `twitterCard?: TwitterCard = 'summary_large_image'`, `twitterSite?`, `twitterCreator?`, `prevUrl?`, `nextUrl?` | — | — (head metadata only) |
| `JsonLd` | One `<script type="application/ld+json">` block, serialised by `serializeJsonLd` | `data: JsonLdObject \| null \| undefined` — nullish renders nothing | — | — |

`serializeJsonLd(data)` escapes `<`, `>`, `&`, U+2028 and U+2029 so authored text cannot close the script element; the output is still valid JSON. `ogImageUrl(card, { href?, basePath? })` builds the content-addressed share-card URL `<basePath>/<slug>.png?t=…&d=…&v=…`, where the `v` token is the card's `updatedAt` in epoch milliseconds, so a content change always mints a new URL (link-preview scrapers only re-fetch a URL they have not seen). It returns `undefined` for a blank title. The param names (`OG_TITLE_PARAM` = `'t'`, `OG_SUBTITLE_PARAM` = `'d'`, `OG_VERSION_PARAM` = `'v'`), the length caps (`OG_TITLE_MAX_LENGTH` = 120 and `OG_SUBTITLE_MAX_LENGTH` = 200 characters, to which `ogImageUrl` truncates the title and description) and `OG_IMAGE_WIDTH` / `OG_IMAGE_HEIGHT` (1200 × 630) are exported so a card renderer reads back exactly what `Head` wrote, and should re-apply the caps itself. The renderer itself is server code and does not live here.

| Type | What it is |
| --- | --- |
| `OgImageCard` | What a share card is built from: `{ id, title, description?, updatedAt? }`. `id` only builds the readable `<slug>.png` path segment; `updatedAt` (a `Date`, ISO string or epoch number) drives the `v` token, and when absent or unparseable the URL is keyed by title and description alone. `Head`'s `shareCard` prop. |
| `OgImageUrlOptions` | `ogImageUrl`'s second argument: `{ href?, basePath? }`. `href` resolves the card path to the emitted URL (identity by default; `Head` passes its `canonicalHref`), `basePath` is where the renderer is mounted (default `'/og'`). |
| `HeadImage` | A share image: `{ url, alt?, width?, height?, type? }`; `url` must be absolute, `type` is the MIME type. `Head`'s `image` and `defaultImage`. |
| `AlternateLink` | One `<link rel="alternate" hreflang>`: `{ href, lang }`, `lang` a BCP 47 tag or `x-default`. `Head`'s `alternates`. |
| `FeedLink` | `Head`'s `feed`: `{ path, title? = 'Latest changes', type? = 'application/feed+json' }`; `path` is resolved through `canonicalHref` like the canonical URL. |
| `Robots` | `Head`'s `robots`: `{ index?, follow? }`, both defaulting to `true`. The `robots` meta is always emitted. |
| `OpenGraphType` | `'website' \| 'article' \| 'profile'` — `Head`'s `openGraphType`, which wins over the one derived from `type`. |
| `SchemaPageType` | `'WebPage' \| 'WebSite' \| 'CollectionPage' \| 'Article' \| 'BlogPosting' \| 'ProfilePage'` — `Head`'s `type`, used only to derive `og:type`. |
| `TwitterCard` | `'summary' \| 'summary_large_image'` — `Head`'s `twitterCard`. |
| `JsonLdObject` | A JSON-LD node with a top-level `@context` — what `JsonLd`'s `data` and `serializeJsonLd` take. Deliberately loose, so `schema-dts`'s `WithContext<Thing>` is assignable to it without this package depending on a vocabulary. |

**Canonical on the production origin.** `Head` resolves the canonical URL, the feed and the share card through `canonicalHref`, which defaults to the components context's `href`. If your `href` returns relative, locale-prefixed paths, pass an absolute resolver instead:

```svelte
<script lang="ts">
  import { Head, JsonLd } from '@thomasfosterau/components/seo';
  import { page } from '$app/state';
  import { locales } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages';

  const canonicalHref = (path: string) => new URL(path, 'https://example.org').href;
</script>

<Head
  title={post.title}
  siteName={m.site_name()}
  description={post.summary}
  type="BlogPosting"
  pathname={page.url.pathname}
  {canonicalHref}
  {locales}
  shareCard={{ id: post.id, title: post.title, description: post.summary, updatedAt: post.updatedAt }}
  defaultImage={{ url: canonicalHref('/og-default.png'), alt: m.site_name(), width: 1200, height: 630, type: 'image/png' }}
  feed={{ path: '/feed.json', title: m.feed_title() }}
/>
<JsonLd data={buildBlogPostingJsonLd(post)} />
```

## tips

`@thomasfosterau/components/tips`. TipKit — contextual, dismissible guidance: an inline tip, a tip anchored to its trigger, the store that decides when either may show, and the stack that decides which one Escape closes.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Tip` | One piece of inline guidance — title, optional message, actions. Shows itself only when its store says it may, and remembers that it did | `config: TipConfig`, `store: TipStore`, `stack? = soloTipStack`, `dismissLabel? = 'Dismiss'`, `class?` | — | `role="status" aria-live="polite"`; the dismiss button has an accessible name from `dismissLabel` |
| `PopoverTip` | A `Tip` anchored to the thing it explains, floating beside it via bits-ui's `Popover` | `config: TipConfig`, `store: TipStore`, `stack? = soloTipStack`, `placement?: TipPlacement = 'top'`, `dismissLabel? = 'Dismiss'`, `class?` | `children` — the trigger content | bits-ui `Popover` dialog ARIA on the trigger; the bubble carries `Tip`'s `role="status"` |

| Export | What it is |
| --- | --- |
| `createTipStore(options?: TipStoreOptions): TipStore` | The store. `TipStoreOptions` is `{ storage?: TipStorage, prefix? = 'tips:' }`; `storage` defaults to `browserTipStorage()`. Call once, high in the tree. |
| `TipStore` | `register(config)` (re-registering an id replaces its config), `shouldDisplay(id)`, `getState(id)`, `markShown(id)`, `dismiss(id)`, `complete(id)`, `resetAll()`. An unregistered id never displays. |
| `TipStorage` | `{ getItem, setItem, removeItem }` — the subset of the DOM `Storage` interface the store needs, so `localStorage` satisfies it and a test can pass a plain object. Every access is guarded; a refusing storage only costs persistence. |
| `browserTipStorage()` / `memoryTipStorage()` | `localStorage` where it exists and accepts a write, else in-memory; and always in-memory (for tests and stories). |
| `createTipStack(): TipStack` / `soloTipStack` | `TipStack` is `{ push, pop, isTopmost }` — which tips are on screen, most recent last, so Escape closes only the topmost. `soloTipStack` always answers "topmost", the default when a tip gets no `stack`. |
| `TipConfig` | A tip as declared: `{ id, title, message?, actions?: TipAction[], rules?: TipRule[], frequency?: TipFrequency, maxDisplayCount? }`. |
| `TipAction` | A button on the tip: `{ id, title, handler: () => void \| Promise<void> }`. Taking one awaits `handler`, then **completes** the tip. |
| `TipRule` | `{ id, evaluate: () => boolean }`; every rule must hold for the tip to show. Synchronous on purpose — await your data first, then register the tip. |
| `TipFrequency` | `'immediate' \| 'hourly' \| 'daily' \| 'weekly' \| 'once'` (default `'immediate'`): how soon a tip may reappear after it was last shown. |
| `TipStatus` | `'pending' \| 'available' \| 'dismissed' \| 'completed'`. `dismissed` and `completed` are both terminal — `shouldDisplay` checks status before frequency, so neither shows again, even at `'immediate'`. |
| `TipState` | What is persisted per tip: `{ id, status, displayCount, lastShown?, dismissedAt?, completedAt? }` (ISO 8601 timestamps). |
| `TipPlacement` | `'top' \| 'bottom' \| 'left' \| 'right'` — `PopoverTip`'s `placement`. |

```ts
import { createTipStore } from '@thomasfosterau/components/tips';

const store = createTipStore({ prefix: 'myapp:tips:' }); // storage defaults to browserTipStorage()
store.register({
  id: 'welcome',
  title: 'Welcome',
  message: 'Track what you grow.',
  frequency: 'once',
});
```

```svelte
<script lang="ts">
  import { Tip, PopoverTip, createTipStore } from '@thomasfosterau/components/tips';
  const store = createTipStore();
  store.register({ id: 'welcome', title: 'Welcome', message: 'Track what you grow.' });
</script>

<Tip config={{ id: 'welcome', title: 'Welcome', message: 'Track what you grow.' }} {store} />

<PopoverTip config={{ id: 'search', title: 'Search across everything', message: 'One box, everything.' }} {store} placement="bottom">
  <button type="button" class="btn btn-primary">Search</button>
</PopoverTip>
```

`open` on `PopoverTip` is derived purely from the store's own state; the trigger never toggles it by clicking. Escape is arbitrated by a shared `TipStack` (`createTipStack()`), so two `PopoverTip`s on one page close in "last shown, first closed" order — pass the same `stack` to both.

## charts

`@thomasfosterau/components/charts`. One component, over a declarative series spec, drawn as plain SVG — no charting dependency.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Chart` | A line, area or bar chart over one y axis, with a data table always present and a hover readout | `series: readonly ChartSeries[]`, `kind?: ChartKind = 'line'`, `title`, `description?`, `height? = 240`, `showTable? = false`, `legendLabel? = 'Series'`, `tableLabel?` (defaults to `title`), `categoryLabel?`, `formatValue?`, `class?` | — | `<svg role="img">` named by `title`; the figures are always reachable through an (optionally hidden) `<table>` captioned by `tableLabel`; the hover readout is `role="status"` |

```svelte
<script lang="ts">
  import { Chart, type ChartSeries } from '@thomasfosterau/components/charts';

  const series: ChartSeries[] = [
    { key: 'flowering', label: 'Flowering', points: [{ label: 'Sep', value: 4 }, { label: 'Oct', value: 9 }] },
    { key: 'pest', label: 'Pest', points: [{ label: 'Sep', value: 6 }, { label: 'Oct', value: 5 }] },
  ];
</script>

<Chart {series} kind="bar" title="Observations by kind" formatValue={(v) => `${v} kg`} showTable />
```

`ChartSeries` is `{ key, label, points: readonly ChartPoint[] }` and `ChartPoint` is `{ label, value }` — `label` the x-axis category, already localised; every series shares the first series' categories, in x order. `ChartKind` is `'line' | 'area' | 'bar'`.

Rules it enforces rather than leaving to the caller: one y axis (two measures of different scale are two charts); the zero line is always drawn; identity is never colour alone (a legend for 2+ series, a direct end-of-line label for ≤4); the numbers are always readable as a `<table>`, visually hidden by default. `key` is stable identity and picks the colour, so a filtered-out series never repaints the survivors that remain.

Series colours come from four validated theme slots, `--color-chart-1…4`, assigned by series order and never cycled — a fifth series draws in `--color-neutral` and the legend says which one it is. See [`theme.css`](https://github.com/thomasfosterau/components/blob/trunk/packages/components/src/lib/theme.css) for the measured separations, and the [package guide's Terms section](https://github.com/thomasfosterau/components/blob/trunk/packages/components/CLAUDE.md#terms) for the rules those measurements exist to keep.

## canvas

`@thomasfosterau/components/canvas`. A low-level toolkit for vector-editing surfaces: pan, zoom, a grid, and pointer gestures reported in canvas coordinates. The application defines its element types, its tools and its renderer — nothing here knows what the elements mean.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `VectorCanvas` | A pan-and-zoom SVG surface over a `VectorDocument`, with elements drawn by a renderer the caller supplies. Reports gestures; mutates nothing | `doc: VectorDocument<T>`, `selected?: ReadonlySet<string>` (default empty), `tool? = 'select'` (`'pan'` is the one it handles itself), `width? = 800`, `height? = 600`, `interactive? = true`, `label? = 'Vector editing canvas'`, `activedescendant? = ''`, `describedby? = ''`, `onkey?` (every keydown and keyup, before the surface's own keys; `preventDefault` claims one), `onfocuschange?`, `onviewportchange?`, `oninteract?`, `class?`, plus the native `<svg>` attributes except the key and focus handlers | `element(shape, selected)` — draws one element; omitted, a fallback marker is drawn. `overlay()` — drawn above every element, in canvas coordinates | `<svg role="application">` named by `label`, one Tab stop when `interactive`, with `aria-activedescendant` / `aria-describedby` from the props above. Keys the application leaves unclaimed (and not a Ctrl, Alt or Meta chord): arrows pan by 40 px with the `pan` tool (Shift: 160), `+` / `=` / `-` zoom about the centre with any tool |

```svelte
<script lang="ts">
  import { VectorCanvas, type CanvasElement, type VectorDocument, type Viewport } from '@thomasfosterau/components/canvas';
  let doc = $state<VectorDocument>(plan);
</script>

<VectorCanvas {doc} tool="pan" width={640} height={360} label="Floor plan"
  onviewportchange={(viewport: Viewport) => { doc = { ...doc, viewport }; }}>
  {#snippet element(shape: CanvasElement, selected: boolean)}
    <rect x={shape.position.x} y={shape.position.y} width="120" height="80" fill={shape.fillColor}
          stroke={selected ? 'var(--color-primary)' : shape.strokeColor} />
  {/snippet}
</VectorCanvas>
```

`oninteract` reports `{ phase: 'down'|'move'|'up', tool, point, detail, native }` in CANVAS coordinates, already snapped when `doc.grid.snap` is set; `detail` counts rapid presses at one spot (2 on the second of a double-press, always 1 on `move` and `up`).

The document model is plain data:

| Type | What it is |
| --- | --- |
| `VectorDocument<T>` | `{ version, metadata, viewport: Viewport, grid: GridConfig, elements: readonly T[] }` — the whole editable document, `version` being your schema version for migrations. |
| `CanvasElement` | What every element carries: `{ id: ElementId, type, position: Point, rotation, zIndex, strokeColor, strokeWidth, fillColor, opacity, locked, visible?, label?, metadata? }`. Extend it with your own element types; `type` is the discriminator your renderer switches on. |
| `ElementId` | `string` — an element's stable identity (`generateId()` mints one with `crypto.randomUUID()`). |
| `Point` | `{ x, y }` in canvas coordinates — the document's own space, not the screen's. |
| `Rect` | `{ x, y, width, height }` — an axis-aligned box in canvas coordinates (`boundingBox`, `pointInRect`). |
| `Viewport` | `{ offsetX, offsetY, zoom }` — pan and zoom, `zoom: 1` being 100%. |
| `GridConfig` | `{ visible, size, snap, color }` — the background grid, its cell size in canvas units, whether pointer positions snap to it, and a CSS colour. |
| `Transform<T>` | A change as data: `{ type: 'add' \| 'update' \| 'delete' \| 'batch', elementIds, elements?, previousElements? }`. Carrying the previous elements is what makes it invertible. |
| `HistoryEntry<T>` | One undo-stack entry: `{ transform, timestamp, description? }` (`timestamp` in epoch milliseconds). |
| `History<T>` | `{ past, future }` — the undo stack (oldest first) and the redo stack (nearest first). The caller owns it, as it owns the document. |
| `HistoryStep<T>` | `{ doc, history }` — the result of one `undo` or `redo`. |

`canvas/history.ts` gives pure undo/redo over `Transform`s rather than document snapshots (`emptyHistory`, `applyTransform`, `invertTransform`, `diffTransform`, `recordEdit`, `undo`, `redo`, `HISTORY_LIMIT = 100`) — a history of edits is bounded by the size of the edits, not the size of the plan. `undo(doc, history)` and `redo(doc, history)` return `readonly HistoryStep[]` holding one step, or none when there is nothing to take back, so `const [step] = undo(doc, history)` needs no sentinel. `canvas/utils.ts` gives the geometry underneath it: `screenToCanvas`/`canvasToScreen`, `snapToGrid`, `distance`, `pointInRect`, `pointNearLine`, `sortByZIndex`, `boundingBox`, `rotatePoint`, `panBy`, `zoomAbout`, `generateId`.

## maps — moved

Maps live in their own package, [`@thomasfosterau/components-mapbox`](https://github.com/thomasfosterau/components/blob/trunk/packages/mapbox/README.md) (`pnpm add @thomasfosterau/components-mapbox mapbox-gl`), because they need `mapbox-gl`; nothing in this package imports it, and `@thomasfosterau/components/maps` is no longer an entry point.

## License

MIT © Thomas Foster

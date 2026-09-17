# @thomasfosterau/components

Accessible Svelte 5 UI primitives, styled with [Tailwind CSS 4](https://tailwindcss.com) + [daisyUI 5](https://daisyui.com) and built on [bits-ui](https://bits-ui.com). 102 components across 16 families: 12 in the core barrel, 4 behind their own entry points. The five maps components live in the sibling package [`@thomasfosterau/components-maps`](../maps/README.md).

Four rules hold across all of them:

- **daisyUI semantic classes, never raw colour.** `bg-base-200`, `text-error`, `btn-primary` — never a hex, an `oklch()` or `bg-green-700`. Variant classes come from a literal `Record<K, string>` lookup table, never a template string (Tailwind only emits classes it can see spelled out).
- **bits-ui owns interaction.** Anything with focus management, keyboard semantics, a popover or an ARIA relationship between elements is built on a bits-ui primitive. Native elements are used where they already give the semantics (`<details>`, `<progress>`, `<time>`, `<data>`, `<dl>`).
- **Every user-facing string is a prop with an English default.** There is no message catalogue — `dismissLabel = 'Dismiss'`, `previousLabel = 'Previous'`. Accessible-name props end in `Label`. An i18n app passes its own messages at the call site.
- **No Effect.** Async callbacks are `(…, signal: AbortSignal) => Promise<T>`; optional values are `T | undefined`. Effect adapters stay in the consuming app.

Every component spreads the native attributes of the element it renders and merges the caller's `class` last, so nothing here ever swallows an `id`, an `aria-*` attribute or a `data-*` hook.

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

Every member is optional in the object you pass — an omitted one falls back individually to `defaultComponentsContext` (identity `href`, `window.location.assign` for navigation, pathname equality for `isCurrent`, runtime-default locale), so every component works unwired in a story or a test.

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
| `@thomasfosterau/components/citations` | citations | `Citation`, `Footnote`, `ReferenceList`, `FootnoteList`, `CreditList`, `DOILink`/`ISBNLink`/`ISSNLink`, `formatCitation`, `BibliographyManager`. |
| `@thomasfosterau/components/canvas` | canvas | `VectorCanvas` and the pan/zoom/history/geometry toolkit underneath it. |
| `@thomasfosterau/components/charts` | charts | `Chart` — one component, plain SVG, no charting dependency. |
| `@thomasfosterau/components/tips` | tips | `Tip`, `PopoverTip`, `createTipStore`, `createTipStack`. |
| `@thomasfosterau/components/theme.css` | — | The daisyUI theme skeleton (see [Installation](#installation)). |

---

# ui

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
| `Skeleton` | Loading placeholders | `variant?: 'block'\|'text'\|'circle'`, `lines? = 3`, `label? = 'Loading'` | — | `role="status"` + `aria-busy="true"`, named by `label`; every shimmering box `aria-hidden` |
| `Heading` | Addressable section heading | `level: 1…6`, `id?`, `anchor?`, `anchorLabel? = 'Link to this section'`, `children: string \| Snippet` | `children` | real `<h1…6>`; id slugged from string children at render (SSR-safe) |
| `VisuallyHidden` | Content for assistive tech only | — | `children` | `sr-only` |
| `Disclosure` | Expandable section | `open? ⚓`, `title: string \| Snippet`, `variant?: 'arrow'\|'plus'\|'plain'`, `contentClass?` | `title?`, `children` | native `<details>`/`<summary>` — no hand-written `aria-expanded` |
| `Tooltip` | Hover/focus supplement | `text?`, `side? = 'top'`, `sideOffset? = 6`, `openDelay? = 400`, `open? ⚓` | `content?`, `children({ props })` | bits-ui `aria-describedby`; Escape closes |
| `Popover` | Floating interactive panel | `open? ⚓`, `side? = 'bottom'`, `align? = 'center'`, `sideOffset? = 8`, `title?`, `closeLabel? = 'Close'` | `trigger({ props })`, `children` | bits-ui dialog ARIA: `aria-haspopup="dialog"`, `aria-expanded`, focus trap, Escape, focus return |
| `Menu` | Nav list or dropdown menu | `mode?: 'dropdown'\|'nav'` (default `nav`), `label`, `open? ⚓`, `side?`, `align?` | `trigger?({ props })`, `children` | nav: `<nav aria-label>` + `<ul class="menu">`; dropdown: bits-ui `role="menu"` |
| `MenuItem` | One entry of a `Menu` | `href?`, `onSelect?`, `current?`, `disabled?` | `icon?`, `children` | nav: `aria-current="page"` + `menu-active`; dropdown: bits-ui `role="menuitem"` |
| `MenuSeparator` | Rule between item groups | — | — | `role="separator"` (dropdown mode) inside a `role="none"` `<li>` |
| `ShareButton` | Platform share sheet | `title?`, `text?`, `url?`, `label? = 'Share'`, `tone?`, `variant? = 'ghost'`, `size? = 'sm'`, `onShare?`, `onError?` | `children?` | renders **nothing** without `navigator.share` (decided after mount) |
| `ThemeToggle` | Light / dark switch | `lightTheme`, `darkTheme`, `storageKey? = 'theme'`, `label? = 'Toggle dark mode'`, `value? ⚓` | — | checkbox with `role="switch"` named by `label` |
| `ConfirmButton` | Two-step inline confirm | `action: () => Promise<unknown>`, `idleLabel? = 'Delete'`, `confirmLabel?`, `cancelLabel?`, `pendingLabel?`, `confirmMessage?`, `failureMessage?`, `tone? = 'error'`, `redirectTo?` | — | failure is an `Alert live="assertive"`; both buttons `disabled` while pending; the confirm button keeps a name (`pendingLabel`) |

`ui` also exports `tones.ts` (`Tone`, `Size`, `HeadingLevel` and the literal `Record<K, string>` class tables — `buttonTone`, `badgeVariant`, `cardVariant`, …), `colour-token.ts` (`colourTokenStyle`, for binding a component's colour custom property to a theme token), and `slug.ts` (`slugify`, used by `Heading`).

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
  import { Menu, MenuItem, MenuSeparator, Button, ThemeToggle } from '@thomasfosterau/components';
  import { ChevronDown } from '@lucide/svelte';
</script>

<!-- Sidebar: a landmark, a list, links, aria-current from the context. -->
<Menu label="Primary">
  <MenuItem href="/gardens">Gardens</MenuItem>
  <MenuItem href="/taxa">Taxa</MenuItem>
</Menu>

<!-- Account menu: bits-ui roving focus, typeahead, Escape, focus return. -->
<Menu mode="dropdown" label="Account">
  {#snippet trigger({ props })}
    <Button {...props} variant="ghost">Ada Lovelace<ChevronDown class="size-4" aria-hidden="true" /></Button>
  {/snippet}
  <MenuItem href="/account">Your profile</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={signOut}>Sign out</MenuItem>
</Menu>

<ThemeToggle lightTheme="garden-light" darkTheme="garden-dark" storageKey="garden:theme" />
```

# layout

The landmarks a page is assembled from, and the blocks that sit inside them. Structure only, never copy: every component takes the app's content as snippets and owns just the element that carries the semantics.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Main` | The page content column | `as? = 'main'` (`'main'\|'section'`) + `HTMLAttributes<HTMLElement>` | `children` | `<main>` is THE landmark, one per page |
| `PageHeader` | What the page is about, and what you can do to it | `title: string \| Snippet`, `subtitle?`, `headingLevel? = 1`, `actionsLabel? = 'Page actions'` | `eyebrow?`, `icon?`, `meta?`, `actions?`, `children?` | `title` is a real heading; `actions` is a `role="group"` named by `actionsLabel`; `icon` is `aria-hidden` |
| `Breadcrumbs` | The ancestor trail | `items: readonly Crumb[]`, `label? = 'Breadcrumb'` | `item?(crumb, index)` | `<nav aria-label>` + `<ol>`; ancestors are links, the trailing crumb is text with `aria-current="page"` |
| `Navbar` | The site banner | `label? = 'Primary'`, `menuLabel? = 'Menu'`, `menuOpen? ⚓` | `start`, `center?`, `end?`, `menu?` | `<header>` (`banner`) > `<nav aria-label>`; the responsive toggle is a bits-ui `Collapsible` |
| `Footer` | The site footer | — + `HTMLAttributes<HTMLElement>` | `children`, `aside?` | `<footer>` (`contentinfo`); `aside` renders first |
| `DetailLayout` | The two-column detail shell | `asideLabel? = 'Summary'` | `header`, `body`, `aside?` | `<aside aria-label>` (`complementary`); mobile order title → aside → body by reordering one render, not rendering twice |
| `Section` | A titled block of a page | `title`, `headingLevel? = 2`, `headingId?`, `count?`, `description?`, `empty? = false`, `emptyMessage? = 'Nothing here yet.'`, `locales?` | `children`, `actions?`, `emptyState?` | `<section aria-labelledby>` pointing at its own heading; `headingId` defaults to a slug of `title` |
| `Tabs` | One strip, two things | `items: readonly TabItem[]`, `mode? = 'panels'`, `value? ⚓`, `label? = 'Sections'`, `variant? = 'border'`, `size? = 'md'` | `panel?(item)` | panels: bits-ui `Tabs` (tablist/tab/tabpanel, roving tabindex, arrows); links: `<nav>` of anchors with `aria-current="page"` |
| `FilterBar` | The filter row above a list | `options: readonly FilterOption[]`, `label` | — | `<nav aria-label>` of `btn`-styled anchors; the active one carries `aria-current="page"` |
| `Sidebar` | The standing navigation column | `label?`, `title?`, `headingLevel? = 2` | `brand?`, `footer?`, `children` (the `MenuItem`s) | the landmark is `Menu mode="nav"`'s; deliberately not an `<aside>` — `complementary` is the wrong landmark for primary navigation |

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
  {#snippet brand()}<a href="/" rel="home">Gardeneria</a>{/snippet}
  <MenuItem href="/gardens">Gardens</MenuItem>
  <MenuItem href="/taxa">Taxa</MenuItem>
</Sidebar>
```

# feedback

Dialogs, toasts, progress — chrome around something that just happened, or is happening now. What these share is the live region and the announcement order, not the markup.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Dialog` | The modal | `open? ⚓`, `title`, `description?`, `closeLabel? = 'Close'`, `size?: 'sm'\|'md'\|'lg'\|'xl'` | `trigger?({ props })`, `children`, `actions?({ close })` | bits-ui `Dialog` owns it all: `role="dialog"` + `aria-modal`, `aria-labelledby`/`describedby`, focus trap, Escape, scroll lock, focus return. daisyUI `modal-box` is styling only |
| `ConfirmDialog` | A destructive action behind a confirmation | `open? ⚓`, `title`, `description?`, `confirmLabel? = 'Delete'`, `cancelLabel? = 'Cancel'`, `pendingLabel? = 'Working…'`, `failureMessage?`, `closeLabel?`, `tone? = 'error'`, `size?`, **either** `onConfirm: () => Promise<unknown>` **or** `form: { action, method? = 'POST', fields?, enhance? }`, `redirectTo?` | `trigger?({ props })`, `children?` | `Dialog`'s, plus a failure as an `Alert live="assertive"` inside the still-open dialog; both buttons `disabled` while pending |
| `Toaster` | The notification region | `position? = 'bottom-end'`, `regionLabel? = 'Notifications'`, `dismissLabel? = 'Dismiss'`, `durationMs? = 6000` | `children` (the app) | ONE `aria-live="polite"` region, present from mount, named by `regionLabel`; nothing live nested inside it — `getToaster()` gives `add({ title, description?, tone? }, durationMs?) → id` and `dismiss(id)` |
| `LoadingBoundary` | Chrome around one read | `state: 'loading'\|'refreshing'\|'error'\|'ready'`, `loadingLabel? = 'Loading…'`, `errorLabel?`, `tone?: 'page'\|'section'` | `children`, `loading?`, `failed?({ message })` | loading chrome `role="status"`; failure `role="alert"`; children stay mounted through `refreshing` |
| `ProgressBar` | Determinate or indeterminate progress | `label`, `value?`, `max? = 100`, `tone? = 'primary'`, `showValue?`, `locales?` | — | native `<progress>`, named by `label`; no `value` attribute at all when indeterminate |
| `SegmentBar` | A proportional stacked bar | `label`, `segments: { label, fraction, colourToken?, tone? }[]`, `showValues?`, `marker?`, `size?: 'sm'\|'md'\|'lg'`, `locales?` | — | ONE `role="img"` whose `aria-label` spells out every segment ("Storage: Photos 62%, Video 31%") |
| `StatTile` | One headline figure | `label`, `value: string \| number`, `delta?: { value, unit?, label? }`, `description?`, `upLabel?`, `downLabel?`, `flatLabel?`, `locales?` | `figure?` | reads label → value → change; the trend arrow is `aria-hidden`, direction is in visually hidden text |
| `Stats` | The wrapper a row of tiles sits in | `orientation?: 'horizontal'\|'vertical'\|'responsive'` (default `responsive`) | `children` | none of its own — name it with `aria-label` when a page has several |
| `Timeline` | A dated sequence | `items: TimelineEntry[]`, `label? = 'Timeline'`, `presentLabel? = 'present'`, `toLabel? = 'to'`, `currentLabel? = 'Current'` | `item?(entry)` | `<ol>` named by `label`; an open-ended entry is introduced by `currentLabel` |

`feedback` also exports `sizes.ts` (`DialogSize`, `ToastPosition`, `BarSize`, `StatsOrientation` and their class tables) and `toaster.ts` (`getToaster`, `setToaster`, `Toast`, `NewToast`, `ToastTone`, `ToasterApi`). `colourToken` on a `SegmentBar` segment or a `TimelineEntry` is a CSS custom-property name your theme declares — see `ui`'s `colourTokenStyle`.

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

# fields

Form controls wired through the `FormField` + `FieldControl` contract. `FormField` (one control) or `Fieldset` (a group) owns the label, hint and errors; it derives `hintId`/`errorId` from a single `id` and hands `children` a `FieldControl`:

```ts
interface FieldControl {
  id: string;
  describedBy: string;
  invalid: boolean;
  required: boolean;
}
```

Every primitive accepts it by spread — `<TextInput {...control} bind:value />` — so `for`/`id`, `aria-describedby`, `aria-invalid` and `required` cannot drift apart. `errors` is always `readonly string[]`; a field that fails three rules says three things.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `FormField` | Label + hint + errors around one control | `id?`, `label`, `hint?`, `errors?: readonly string[]`, `required?`, `requiredLabel? = '(required)'` + `HTMLAttributes<HTMLDivElement>` | `children(control)` | `<label for>` names the control; `describedBy` lists hint id then error id; `aria-invalid` when there are errors |
| `Fieldset` | The same frame for a GROUP | `legend`, `hint?`, `errors?`, `required?`, `requiredLabel?` + `HTMLAttributes<HTMLFieldSetElement>` | `children` | real `<fieldset>`/`<legend>`; hint/errors are `aria-describedby` on the fieldset; `data-invalid` instead of `aria-invalid` (the implicit `group` role rejects it) |
| `TextInput` | The daisyUI `input` | `value ⚓`, `type? = 'text'` (`text\|email\|url\|password\|tel\|number\|search`), `size?: FieldSize`, `invalid?`, `describedBy?` + `HTMLInputAttributes` | — | native `<input>` |
| `Textarea` | The daisyUI `textarea` | `value ⚓`, `rows? = 4`, `size?`, `invalid?`, `describedBy?` | — | native `<textarea>` |
| `Select` | One choice, natively | `options: (FieldOption \| string)[]`, `value ⚓`, `placeholder?`, `size?`, `invalid?`, `describedBy?` | — | native `<select>`; placeholder is a disabled first `<option>` |
| `Checkbox` | One box with its own label | `label`, `checked ⚓`, `size?`, `invalid?`, `describedBy?` + `HTMLInputAttributes` | — | `<label>`-wrapped `<input type="checkbox">` — no `id`/`for` pair needed |
| `CheckboxGroup` | Several boxes, one question | `legend`, `options`, `values ⚓: string[]`, `name?`, `hint?`, `errors?`, `required?`, `disabled?`, `size?` | — | a `Fieldset` of `Checkbox` |
| `RadioGroup` | One choice from a short list | `legend`, `options`, `value ⚓`, `orientation? = 'vertical'`, `name?`, `hint?`, `errors?`, `required?`, `disabled?` | — | bits-ui `RadioGroup`: one tab stop, arrows move and select, wrap-around |
| `Toggle` | A setting that takes effect now | `checked ⚓`, `label`, `description?`, `onChange?: (next) => Promise<boolean> \| boolean`, `size?`, `invalid?`, `describedBy?` | — | `role="switch"` on a native checkbox; `description` is `aria-describedby`, never folded into the name; `aria-busy` while `onChange` is in flight |
| `DateInput` | An ISO calendar date | `value ⚓` (`YYYY-MM-DD`), `min?`, `max?`, `size?`, `invalid?`, `describedBy?` | — | native `<input type="date">` |
| `FileInput` | A file, with a size cap | `file ⚓: File \| undefined`, `accept?`, `maxBytes?`, `tooLargeMessage? = 'That file is too large.'`, `onSelect?`, `size?`, `invalid?`, `describedBy?` | — | native file input; an over-size file is cleared and explained in an `alert` |
| `ImageInput` | `FileInput` + preview + dimension probe | `file ⚓`, `width ⚓`, `height ⚓`, `previewAlt? = 'Preview of the selected image'`, `name?`, `accept?`, `maxBytes?`, `tooLargeMessage?` | — | preview `<img>` named by `previewAlt`; emits hidden `width`/`height` inputs once `name` is set |
| `VideoInput` | `FileInput` + a progress readout | `file ⚓`, `progress ⚓` (0–100), `progressLabel? = 'Upload progress'`, `onSelect?`, `accept? = 'video/*'`, `maxBytes?`, `tooLargeMessage?` | — | native `<progress>` named by `progressLabel`, shown only while `0 < progress < 100` |
| `SearchInput` | A search field with clear and spinner | `label`, `value ⚓`, `onInput?`, `onSubmit?`, `onClear?`, `pending?`, `clearLabel? = 'Clear search'`, `size?`, `name? = 'q'`, `placeholder? = 'Search'` | — | composite `<div class="input">`; icon/spinner `aria-hidden`; clear button labelled |
| `Combobox<T>` | Typeahead over a list or a search | `value ⚓: string \| undefined`, `items?: readonly T[]` **or** `onSearch: (query, signal) => Promise<readonly T[]>`, `debounceMs? = 150`, `getId`, `getLabel`, `getBadge?`, `label`, `placeholder?`, `name?`, `emptyLabel? = 'No matches'`, `pendingLabel? = 'Searching…'`, `errorMessage?`, `id?`, `describedBy?`, `invalid?`, `required?`, `size?` | `item?(item)`, `footer?({ query, pending })`, `empty?({ query })` | bits-ui listbox ARIA; Enter with nothing highlighted lets a wrapping `<form>` submit |
| `FieldErrors` | The messages under one control | `errors: readonly string[]`, `id?` + `HTMLAttributes<HTMLDivElement>` | — | ONE `role="alert"` region holding one `<p>` per message; renders nothing while empty |

`fields` also exports `field-types.ts` (`FieldControl`, `FieldSize`, `FieldOption`, `FieldOptionInput`, `toFieldOptions`) and the daisyUI size tables (`inputSize`, `selectSize`, …).

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

# forms

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

# data

The tables, lists and pagers an index page and a detail page are built from. Two shapes run through it: **`Table` and `ItemList` present a window the caller already chose** (they never decide which rows exist, so a server-paged 40,000 rows is as easy as four). **`DataGrid` sorts, filters and pages a bounded set the page already holds, on the client**, composing the other two rather than duplicating them.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Table<T>` | Column-driven `table` over a window the caller chose | `rows`, `columns: TableColumn<T>[]`, `rowKey`, `caption?`, `captionHidden?`, `size?: Size`, `zebra?`, `pinRows?`, `sort? ⚓: SortState`, `onSort?`, `onSelect?(row)`, `emptyMessage? = 'Nothing to show.'`, `sortLabel?(column)`, `containerClass?` + `HTMLTableAttributes` | `emptyState?`, `foot?` | `<caption>` is the accessible name (`sr-only` when `captionHidden`); `<th scope="col">`; sortable header is a real `<button>`, `<th>` carries `aria-sort`; `onSelect` rows take `role="button"` + `tabindex="0"` + Enter/Space |
| `DataGrid<T>` | Client-side sort + filter + page over a bounded set | as `Table` plus `filterable?`, `paginated? = true`, `pageSize? = 10`, `pageSizeOptions?`, `filterLabel? = 'Search'`, `filterPlaceholder?`, `rowsPerPageLabel?`, `showingLabel?(start,end,total)`, `pageOfLabel?(page,pages)`, `previousLabel?`, `nextLabel?`, `paginationLabel?`, `locales?` | `emptyState?` | the `Table`'s and the `Pagination`'s combined |
| `Pagination` | The one pager: numbered window or prev/next, links or callbacks | `offset`, `limit`, `total`, `variant?: 'window'\|'prevNext'`, `href?(offset)` **or** `onPage?(offset)`, `siblings? = 1`, `label? = 'Pagination'`, `previousLabel?`, `nextLabel?`, `pageLabel?(page)`, `size?: Size`, `showRange?`, `rangeLabel?(start,end,total)`, `statusLabel?(page,pages)`, `locales?` | — | `<nav aria-label>`; `rel="prev"`/`rel="next"`; unavailable arm is an `aria-disabled` `<span>`, never a dead link |
| `ResultCount` | "Showing 24 of 4,310" under a windowed list | `shown`, `total`, `label?(shown,total)`, `locales?` | — | plain `<p>`, deliberately not a live region |
| `PaginationFooter` | `ResultCount` + `Pagination` from one set of numbers | `shown`, `offset`, `limit`, `total`, `href?`/`onPage?`, `variant?`, `siblings?`, `size?`, `label?`, `previousLabel?`, `nextLabel?`, `pageLabel?`, `countLabel?`, `locales?` | — | its two parts' |
| `ItemList<T>` | The list container, keying and empty state | `items`, `variant?: 'compact'\|'stacked'\|'grid'\|'cards'`, `getKey(item,index)`, `emptyMessage? = 'Nothing here yet.'`, `feed?`, `label?`, `busy?` | `item(item, index)`, `empty?` | default: `<ul>`/`<li>`; `feed`: `<div role="feed" aria-label aria-busy>` of `<article aria-posinset aria-setsize tabindex="-1">` |
| `LinkListItem` | The common row body | `href`, `title`, `subtitle?`, `badges?`, `headingLevel?` | `meta?` | the title is the row's only interactive element |
| `DescriptionList` | `<dl>` of label/value pairs in four shapes | `variant?: 'grid'\|'card'\|'divided'\|'inline'`, `mono?`, `showEmpty?`, `emptyLabel? = 'unrecorded'` | `children` | a real `<dl>` |
| `DescriptionRow` | One pair inside it | `label`, `value?` **or** `children`, `valueClass?`, `labelClass?`, `showEmpty?`, `emptyLabel?` | `children?` | `<dt>`/`<dd>`; a row with nothing renders **nothing** (or `emptyLabel` when `showEmpty`) |
| `TreeList` | One collapsible node of a hierarchy | `open? ⚓ = true`, `title: string \| Snippet` | `title?`, `children?` | native `<details>`/`<summary>` inside `<ul>`/`<li>`; deliberately **not** `role="tree"` |
| `TreeListItem` | One leaf under it | — | `children?` | a plain `<li>` |
| `DiffText` | A word- or character-level diff inline | `segments: DiffSegment[]`, `separator? = ' '`, `insertLabel?`, `deleteLabel?` | — | `<ins>`/`<del>` carry the meaning; colour and strike-through are the second copy, never the only one |

`data` also exports `pageWindow`, `pageHref`, `nextSortState`, `columnAriaSort`, and the types `TableColumn`, `SortState`, `LinkListItemData`, `DiffSegment`. `pageHref(base, page, names?)` writes the position into `base`'s query, preserving every other parameter and the hash (JSON:API's `page[offset]`/`page[limit]` by default) — the callback shape a filtered list's pager needs so its own filter survives.

```svelte
<script lang="ts">
  import { Table, DataGrid, PaginationFooter, pageHref, ItemList, LinkListItem, DescriptionList, DescriptionRow, type SortState, type TableColumn } from '@thomasfosterau/components';

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
```

# infobox

One family, two ways to fill it. Composed primitives (`InfoboxHeader`, `InfoboxImage`, `InfoboxSection`, `InfoboxRow`) let a page build bespoke markup; a typed `rows` convenience on `Infobox` itself lets a page instead hand over a `$derived<InfoboxRowSpec[]>` built from sparse entity attributes — both render through the same primitives, so a fix to row layout lands once.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Infobox` | The summary rail frame | `title?`, `subtitle?`, `label='Key facts'`, `image?: InfoboxImageSpec`, `rows?: readonly InfoboxRowSpec[]`, `float?` (grid-column aside by default; off is gardeneria's float-right rail) + `HTMLAttributes<HTMLElement>` | `children?` (extra composed markup, rendered after `rows`) | `<aside aria-label={title ?? label}>` |
| `InfoboxHeader` | The title block | `title`, `subtitle?` + `HTMLAttributes<HTMLDivElement>` | — | `<h3>`, deliberately outside the document outline |
| `InfoboxImage` | The identifying picture | `src`, `alt`, `caption?`, `width?`, `height?`, `eager?` | — | `<figure>`/`<img>`/`<figcaption>`; default lazy |
| `InfoboxSection` | A titled group of rows | `title?` + `HTMLAttributes<HTMLDListElement>` | `children` (the rows) | owns the `<dl>` |
| `InfoboxRow` | One label/value pair | `label`, `value?: string \| number`, `href?` (through the components context), `external?`, `emptyLabel='unrecorded'`, `showEmpty?` + `HTMLAttributes<HTMLDivElement>` | `children?` (wins over `value`) | `<dt>`/`<dd>` pair; **empty by default** — `showEmpty` opts into an em dash captioned by `aria-label={emptyLabel}` |

`InfoboxRowSpec` is a discriminated union — `{ kind: 'fact', label, value }` \| `{ kind: 'link', label, text, href, external? }` \| `{ kind: 'links', label, links: InfoboxLinkEntry[] }` \| `{ kind: 'image', ...InfoboxImageSpec }` \| `{ kind: 'custom', label, content: Snippet }` — filtered by the exported `infoboxRowIsPresent(row)`.

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
    { kind: 'image', src: taxon.image?.url, alt: taxon.name, eager: true },
    { kind: 'fact', label: 'Family', value: taxon.family },
    { kind: 'links', label: 'Synonyms', links: taxon.synonyms.map((s) => ({ label: s.name, href: s.href })) },
  ];
</script>
<Infobox title={taxon.name} {rows} />
```

# formatting

Locale-aware rendering of dates, numbers, lists, relative time and search-result highlighting. Every `Intl` constructor reads `locales`, then falls back to `getComponentsContext().locale()`.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `DateTime` | `<time>` with an ISO `datetime` and `Intl.DateTimeFormat` text | `value: Date \| number \| string`, `locales?`, `dateStyle? = 'medium'`, `timeStyle?`, `options?: Intl.DateTimeFormatOptions` (wins over the styles) | `children?` — replaces the text; `datetime` stays machine-readable | native `<time>` semantics only |
| `NumberFormat` (also exported as `Number`; `NumberFormat` is primary, since a `Number` export would shadow the global) | `<data>` with a raw `value` attribute and `Intl.NumberFormat` text | `value: number \| bigint`, `locales?`, `style?`, `unit?`, `unitDisplay?`, `currency?`, `currencyDisplay?`, `maximumFractionDigits?`, `minimumFractionDigits?`, `signDisplay?`, `notation?`, `options?: Intl.NumberFormatOptions` (wins) | — | native `<data>` semantics only |
| `FormatList<T>` | Renders items through `Intl.ListFormat.formatToParts`, so conjunction/disjunction text ("and", ", ") comes from the runtime | `items: readonly T[]`, `style? = 'long'`, `type? = 'conjunction'`, `locales?` | `children(item: T)` | no wrapper element |
| `RelativeTime` | "3 hours ago" / "in 2 days" via `Intl.RelativeTimeFormat`, picking the largest unit whose magnitude rounds to ≥ 1 | `value: Date \| number \| string`, `now?` (pin it in tests), `locales?`, `numeric? = 'auto'`, `style? = 'long'` | — | `<time datetime=ISO title=absolute>` — the absolute instant is never hidden |
| `Highlight` (+ exported `tokenise`) | Best-effort client-side token highlight for search results | `text: string`, `query: string` | — | `<mark>` per matched token; naive — a UX nicety, not the authoritative FTS match |

```svelte
<DateTime value={post.publishedAt} dateStyle="long" />
<NumberFormat value={price} style="currency" currency="AUD" />
<p><FormatList items={tags}>{#snippet children(tag)}<Badge>{tag}</Badge>{/snippet}</FormatList></p>
<RelativeTime value={comment.createdAt} />
<p><Highlight text={result.title} query={searchQuery} /></p>
```

# links

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `EmailLink` | A `mailto:` anchor whose query string is built with `URLSearchParams`, so every value is correctly encoded | `email: string`, `subject?`, `body?`, `cc?`, `bcc?`, `class` merged last, spreads `HTMLAnchorAttributes` | `children?` — replaces the link text; defaults to the address | native `<a>` — visible text is the accessible name |

```svelte
<EmailLink email="hello@thomasfoster.au" subject="Question about your garden">
  {#snippet children()}Contact us{/snippet}
</EmailLink>
```

# media

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

# hotkeys

One registry answers "what can the viewer do right now"; `HotkeyProvider` matches keystrokes against it, `HotkeyHelpDialog` lists what carries a trigger, and `search`'s `CommandPalette` lists what is palette-visible. An app creates the registry in its root layout, renders `HotkeyProvider` once, and registers actions from anywhere below — global ones from the layout, page ones from the page, torn down on unmount.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `HotkeyProvider` | The single global `keydown` listener: chords, sequences, the editable guard | — (reads the registry from context) | — | renders nothing. Its obligation is negative — it never steals a keystroke from a control that needs one. While focus is in an editable target, or while `paletteOpen`/`helpOpen` is set, only `allowInEditable` actions fire |
| `HotkeyBadge` | A trigger as `kbd` chips | `trigger: HotkeyTrigger`, `commandLabel? = '⌘'`, `controlLabel? = 'Ctrl'`, `thenLabel? = 'then'` + `HTMLAttributes<HTMLSpanElement>` | — | `<kbd>` per key; `$mod` renders as `controlLabel` on the server and resolves per platform after mount |
| `HotkeyHelpDialog` | The `?` overlay listing every live hotkey | `title? = 'Keyboard shortcuts'`, `closeLabel? = 'Close'`, `emptyLabel?`, `groupLabels? = { page: 'This page', global: 'Everywhere' }`, `commandLabel?`, `controlLabel?`, `thenLabel?` | — | this library's `Dialog`; each scope is a `<section>` with a heading over a `<ul>`. Opened/closed through the registry's `helpOpen` |

| Export | What it is |
| --- | --- |
| `createHotkeyRegistry({ isAdmin, dev? })` | Creates the registry and puts it in context. Call once, from the root layout. `isAdmin` is a function, so the gate is reactive. |
| `getHotkeyRegistry()` / `tryGetHotkeyRegistry()` | Read it back; the second returns `undefined` instead of throwing — the seam `CommandPalette` uses to work with no registry. |
| `registerHotkeys(() => actions, { scope? })` | Declarative registration for the calling component's lifetime; `scope` defaults to `'page'`. |
| `HotkeyTrigger` | Either a **chord** (`'$mod+k'`) — modifiers held together, `$mod` being ⌘ on Apple platforms and Ctrl elsewhere — or a **sequence** (`'e'`, `['g', 'p']`) of plain keys pressed in order, buffered for `SEQUENCE_TIMEOUT_MS`. |

```svelte
<!-- Root layout, once. -->
<script lang="ts">
  import { createHotkeyRegistry, registerHotkeys, HotkeyProvider, HotkeyHelpDialog, CommandPalette } from '@thomasfosterau/components';

  const hotkeys = createHotkeyRegistry({ isAdmin: () => user?.isAdmin === true, dev });
  registerHotkeys(() => [
    { id: 'palette.toggle', label: 'Open the command palette', group: 'actions', trigger: '$mod+k', allowInEditable: true, paletteVisible: false, run: () => (hotkeys.paletteOpen = !hotkeys.paletteOpen) },
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

# search

One component, because a palette is one thing: a dialog, a query box, and rows from wherever the app has them. It composes this library's `Dialog` with bits-ui's `Command`, taking rows from up to three places at once — a mounted hotkey registry's `paletteActions`, a static `items` prop, and an asynchronous `onSearch` — none required.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `CommandPalette` | The ⌘K palette: actions, navigation and search results in one list | `open? ⚓` (two-way bound to the registry's `paletteOpen` when a registry exists), `label? = 'Command palette'`, `placeholder? = 'Type a command or search…'`, `loadingLabel? = 'Searching…'`, `emptyLabel? = 'No results'`, `closeLabel? = 'Close'`, `groups?: readonly { id, label }[]`, `items?: readonly CommandItem[]`, `onSearch?: (query, signal) => Promise<readonly CommandItem[]>`, `debounceMs? = 150`, `onSelect?: (item) => void` | `item?(item)` | `Dialog`'s plus `Command`'s: the input is a `combobox` owning a `listbox`, each row an `option`, `aria-activedescendant` follows the arrow keys. The pending row is a `progressbar` named by `loadingLabel` |

`onSearch` follows the same debounce / latest-wins (`AbortController`) / stale-while-revalidate rules as `fields/Combobox`. `CommandItem` is `{ id, label, group, hint?, badge?, run?, href? }`; activation closes the palette, calls `onSelect`, then `run`, then navigates to `href` through the components context.

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

# citations

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

`formatCitation`, `BibliographyManager`, `setupBibliography`, `getBibliographyContext`, and the `CitationData`/`CitationKind`/`FootnoteData`/`Credit` types are also exported. (`Citation` and `Footnote` name the components; the data shapes are `CitationData`/`FootnoteData` to avoid a value/type collision.)

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

# tips

`@thomasfosterau/components/tips`. TipKit — contextual, dismissible guidance: an inline tip, a tip anchored to its trigger, the store that decides when either may show, and the stack that decides which one Escape closes.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Tip` | One piece of inline guidance — title, optional message, actions. Shows itself only when its store says it may, and remembers that it did | `config: TipConfig`, `store: TipStore`, `stack?: TipStack`, `dismissLabel? = 'Dismiss'`, `class?` | — | `role="status" aria-live="polite"`; the dismiss button has an accessible name from `dismissLabel` |
| `PopoverTip` | A `Tip` anchored to the thing it explains, floating beside it via bits-ui's `Popover` | `config: TipConfig`, `store: TipStore`, `stack?: TipStack`, `placement? = 'top'` (`'top'\|'bottom'\|'left'\|'right'`), `dismissLabel? = 'Dismiss'`, `class?` | `children` — the trigger content | bits-ui `Popover` dialog ARIA on the trigger; the bubble carries `Tip`'s `role="status"` |

`createTipStore`, `createTipStack`, `soloTipStack`, `memoryTipStorage`, `browserTipStorage` and the `Tip*` types are also exported.

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

# charts

`@thomasfosterau/components/charts`. One component, over a declarative series spec, drawn as plain SVG — no charting dependency.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `Chart` | A line, area or bar chart over one y axis, with a data table always present and a hover readout | `series`, `kind? = 'line'` (`'line'\|'area'\|'bar'`), `title`, `description?`, `height? = 240`, `showTable?`, `legendLabel? = 'Series'`, `tableLabel?` (defaults to `title`), `categoryLabel?`, `formatValue?`, `class?` | — | `<svg role="img">` named by `title`; the figures are always reachable through an (optionally hidden) `<table>` captioned by `tableLabel`; the hover readout is `role="status"` |

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

Rules it enforces rather than leaving to the caller: one y axis (two measures of different scale are two charts); the zero line is always drawn; identity is never colour alone (a legend for 2+ series, a direct end-of-line label for ≤4); the numbers are always readable as a `<table>`, visually hidden by default. `key` is stable identity and picks the colour, so a filtered-out series never repaints the survivors that remain.

Series colours come from four validated theme slots, `--color-chart-1…4`, assigned by series order and never cycled — a fifth series draws in `--color-neutral` and the legend says which one it is. See [`theme.css`](src/lib/theme.css) for the measured separations, and `packages/components/CLAUDE.md`'s Terms section for the rules those measurements exist to keep.

# canvas

`@thomasfosterau/components/canvas`. A low-level toolkit for vector-editing surfaces: pan, zoom, a grid, and pointer gestures reported in canvas coordinates. The application defines its element types, its tools and its renderer — nothing here knows what the elements mean.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `VectorCanvas` | A pan-and-zoom SVG surface over a `VectorDocument`, with elements drawn by a renderer the caller supplies. Reports gestures; mutates nothing | `doc`, `selected?`, `tool?`, `width?`, `height?`, `interactive?`, `label? = 'Vector editing canvas'`, `onviewportchange?`, `oninteract?`, `class?`, plus the native `<svg>` attributes | `element(shape, selected)` — draws one element; omitted, a fallback marker is drawn | `<svg role="application">` named by `label`. `application` is the honest role for a surface whose whole vocabulary is pointer gestures — and a promise the page must keep by offering a non-pointer route to the same edits |

```svelte
<script lang="ts">
  import { VectorCanvas, type CanvasElement, type Viewport } from '@thomasfosterau/components/canvas';
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

`oninteract` reports `{ phase: 'down'|'move'|'up', tool, point, detail, native }` in CANVAS coordinates, already snapped when `doc.grid.snap` is set. `canvas/history.ts` gives pure undo/redo over `Transform`s rather than document snapshots (`emptyHistory`, `applyTransform`, `invertTransform`, `diffTransform`, `recordEdit`, `undo`, `redo`, `HISTORY_LIMIT = 100`) — a history of edits is bounded by the size of the edits, not the size of the plan. `canvas/utils.ts` gives the geometry underneath it: `screenToCanvas`/`canvasToScreen`, `snapToGrid`, `distance`, `pointInRect`, `pointNearLine`, `sortByZIndex`, `boundingBox`, `rotatePoint`, `panBy`, `zoomAbout`, `generateId`.

# maps — moved

Maps live in a package of their own: **[`@thomasfosterau/components-maps`](../maps/README.md)** — `StaticMap`, `DynamicMap`, `Map`, `MapEditor`, `MapShapeView`, plus `staticMapUrl` and the GeoJSON ↔ canvas seam.

They were split out because their behaviour needs a specific third-party engine, `mapbox-gl`. A component that needs one lives in its own package adjacent to this one, so this one stays free of it: nothing here imports `mapbox-gl`, it is no longer a peer of this package at any level, and `@thomasfosterau/components/maps` is no longer an entry point. In the maps package `mapbox-gl` is a **required** peer — installing that package is the decision to render a map.

```sh
pnpm add @thomasfosterau/components-maps mapbox-gl
```

`MapEditor` is still built on `@thomasfosterau/components/canvas`, which the maps package takes as a `workspace:*` dependency; see [Canvas](#canvas) for the toolkit underneath it.

# UI: buttons, badges and surfaces

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

Buttons, badges and surfaces — the family every other family builds on: `Alert` is what a form's errors surface in, `Card` is the surface a section is drawn on, `Button` is what a dialog's actions are. An icon-only control is an `IconButton`, never a `Button` with an `aria-label` and empty text: `Button`'s `children` is its name, and `IconButton` adds the required `label`, the tooltip and the 24×24 target.

`ui` also exports:

- **`tones.ts`** — the daisyUI vocabulary as types: `Tone` (the semantic colours), `StatusTone` (`'info' | 'success' | 'warning' | 'error'`, what `Alert` takes), `Size` (`'xs'`…`'xl'`), `HeadingLevel` (`1`…`6`), `ButtonVariant`, `BadgeVariant`, `AlertVariant`, `LinkVariant` (`'primary' | 'muted' | 'plain'`), `CardVariant` (`'border' | 'dash' | 'plain'`), `DividerAlign`, `SpinnerVariant`, `DisclosureVariant` (`'arrow' | 'plus' | 'plain'`) and `ChipSize` (`'sm' | 'md'`), `AvatarShape` (`'circle' | 'rounded' | 'square'`). Each has a literal `Record<K, string>` class table, so Tailwind's scanner sees every class: `buttonTone`, `buttonVariant`, `buttonSize`, `badgeTone`, `badgeVariant`, `badgeSize`, `alertTone`, `alertVariant`, `progressTone`, `dividerTone`, `dividerAlign`, `dividerOrientation`, `loadingVariant`, `loadingSize`, `rangeTone`, `linkVariant`, `cardVariant`, `cardSize`, `collapseVariant` (the `Disclosure` marker), `chipSize`, `chipSwatchSize`, `avatarSize`, `avatarShape`, plus the prefix-free `backgroundTone` and `textTone` for a swatch or segment of your own.
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

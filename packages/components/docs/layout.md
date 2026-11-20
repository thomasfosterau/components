# Layout: landmarks, navigation and spacing

The landmarks a page is assembled from, and the blocks inside them. Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

Structure only, never copy: every component takes the app's content as snippets and owns just the element that carries the semantics.

**`Sidebar` or `BottomNav`?** The same destinations, by width: a standing `Sidebar` from `sm` up, a `BottomNav` below it. Hide the inactive one with `hidden` / `sm:hidden` (never `invisible` or opacity), so exactly one "Primary" navigation landmark is in the tree, and pad the page for the fixed bar:

```svelte
<Sidebar class="hidden sm:block" label="Primary">…</Sidebar>
<Main class="pb-(--bottom-nav-height) sm:pb-0">…</Main>
<BottomNav class="sm:hidden">
  <BottomNavItem href="/gardens" label="Gardens" icon={gardensIcon} />
  <BottomNavItem href="/taxa" label="Taxa" icon={taxaIcon} />
</BottomNav>
```

**One set of destinations, three widths.** Declare the app's top-level destinations once, as `NavDestination`s (`href`, `label`, `icon`, `currentIcon?`, `badge?`, `compact?`), and give them to `AppShell`: a bottom bar on a phone, a `NavigationRail` on a tablet or a narrow window, a `Sidebar` on a desktop. `compact: false` keeps a destination out of the bar, which holds five at most. The tiers are switched by CSS, so server-rendered markup is right at every width, with one "Primary" landmark:

```svelte
<script lang="ts">
  import { AppShell, type NavDestination } from '@thomasfosterau/components';
  const destinations: readonly NavDestination[] = [
    { href: '/gardens', label: 'Gardens', icon: gardensIcon },
    { href: '/inbox', label: 'Inbox', icon: inboxIcon, currentIcon: inboxFilledIcon, badge: unread },
    { href: '/settings', label: 'Settings', icon: settingsIcon, compact: false },
  ];
</script>

<AppShell {destinations} {brand} {account}>{@render children()}</AppShell>
```

Without `AppShell`, `Sidebar` and `BottomNav` take the same list as `destinations`, so an app that lays out its own frame still declares them once. Both resolve hrefs and mark the current one through the components context; `BottomNav` leaves out `compact: false`, and either renders `children` after the destinations, so hand-written items still work. `AppShell` builds its sidebar and bottom bar this way.

```svelte
<Sidebar class="hidden sm:block" {destinations} />
<BottomNav class="sm:hidden" {destinations} />
```

**Drill-down screens.** For list → item → sub-item flows on a phone, render each screen as a `StackPage` (`title`, `backHref`) inside a `NavigationStack`, and report navigations to the stack from the router. A push slides the new screen in and focuses its `h1`; a pop slides back and returns focus to the row the reader opened, the step most web apps miss. The Back link is a real link named for where it goes ("Back to Beds"), and on touch a swipe from the leading edge follows it. Routing stays the app's; in SvelteKit the root layout wires it in three lines:

```svelte
<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import { createNavigationStack, NavigationStack } from '@thomasfosterau/components';

  const stack = createNavigationStack();
  onNavigate((navigation) => stack.onNavigate(navigation));
</script>

<NavigationStack>{@render children()}</NavigationStack>
```

`onNavigate` infers the direction (browser Back, or a link to the current screen's `backHref`, is a pop; anything else a push); pass a second argument (`'push' | 'pop' | 'replace'`) to override it. The slides are in `theme.css` and stand down under `prefers-reduced-motion`; without the View Transitions API navigation is instant and focus behaves the same.

`layout` also exports `types.ts` (`Crumb`, `TabItem`, `FilterOption`, `TabsMode`, `TabsVariant`, `tabsVariant`, `tabsSize`) and `nav-destination.ts` (`NavDestination`, `NavBreakpoints`, `MediumAt`, `ExpandedAt`).

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
<!-- Too many to fit: the rest go into a "More" menu; the current tab always stays. -->
<Tabs items={sections} mode="links" label="Sections" overflow />
<Breadcrumbs items={trail} overflow />

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

`ui/Stack` is a different thing: daisyUI's overlapping pile of cards.

### Scroll behaviours

`Navbar` and `PageHeader` take the top-bar behaviours the platforms ship (iOS large titles, Compose's `TopAppBar` scroll behaviours), so an app doesn't write its own scroll listeners. Each reads the scroll position at most once per frame, from the window or from `scrollContainer`.

```svelte
<Navbar scrollBehavior="pinned" {start} />
<Main>
  <PageHeader title="Tomato ‘Black Krim’" collapsedTitle="Black Krim" scrollBehavior="collapse" />
  …
</Main>
```

- **`Navbar` `scrollBehavior`.** `'static'` (the default) is in the flow. `'pinned'` sticks to the top. `'hide-on-scroll'` sticks, slides away while scrolling down, and comes back scrolling up or as soon as anything in it takes focus, so a keyboard user never tabs into a hidden bar. Under `prefers-reduced-motion` a hide-on-scroll bar stays pinned.
- **`elevateOnScroll`.** The bar's border and shadow appear only once content is under it (`data-scrolled` is set then). It is on by default for a stuck bar.
- **Anchors land below a stuck bar.** A pinned or hide-on-scroll `Navbar` sets `--navbar-offset` (its height, or `0px` while hidden) and `scroll-padding-top: var(--navbar-offset)` on the scroller, and removes both when it unmounts.
- **`PageHeader` `scrollBehavior="collapse"`.** When the large title scrolls up under the top (below a stuck `Navbar`), a compact bar with `collapsedTitle` fades in. It falls back to `title` when that is a string. The bar is `position: fixed`, so nothing below it moves. It is `aria-hidden`, so the heading stays the page's one `h1` at every scroll position. Under reduced motion it switches at halfway instead of fading.

### DashboardGrid

`DashboardGrid` lays out tiles (stat tiles, charts, lists, maps) on a column grid and lets the reader arrange them. Each tile is an `id`, a `title` and a `content` snippet; where it sits is a `TileLayout` (`x`, `y`, `w`, `h` in cells, and `hidden`) in the bindable `layout`, which the app persists per reader.

```svelte
<script lang="ts">
  import { DashboardGrid, StatTile, type TileLayout } from '@thomasfosterau/components';

  let layout = $state<TileLayout[]>(saved ?? defaults);
</script>

{#snippet rainfall()}<StatTile label="Rainfall" value="12 mm" />{/snippet}
{#snippet tasks()}<TaskList … />{/snippet}

<DashboardGrid
  tiles={[
    { id: 'rainfall', title: 'Rainfall', content: rainfall, sizes: ['sm', 'md'] },
    { id: 'tasks', title: 'This week', content: tasks, sizes: ['md', 'lg', 'tall'] },
  ]}
  bind:layout
  defaultLayout={defaults}
  onLayoutChange={(next) => save(next)}
/>
```

- **Edit mode.** "Edit dashboard" (a toggle button) shows each tile's Move handle and options menu, plus Add widget (removed tiles) and Reset layout (with `defaultLayout`, after a confirmation). Outside edit mode a tile has no controls.
- **Moving.** The handle drags with a pointer, or picks up on Space, moves a cell per arrow key, and drops on Space (Escape cancels). The first tile a moved tile lands on takes its old cell when it fits there; anything else it covers is pushed down, and the grid then compacts upward. The menu moves a tile up, down, to the start or to the end in reading order.
- **Sizes are presets**, not free resizing: `sm` 1×1, `md` 2×1, `lg` 2×2, `wide` 4×1 and `tall` 1×2 (columns × rows, `tileSizes`), clamped to the grid. A tile's `sizes` lists the ones its menu offers; the first is its size when the layout has no entry for it.
- **Columns.** `columns` is a count per breakpoint, read from the grid's own width (`{ sm: 2, md: 4, lg: 6 }` by default, one column below `sm`), or a fixed number. The layout is stored at the widest count. A narrower grid repacks the tiles in reading order, and there the handle and menu reorder tiles rather than move them in two dimensions, so editing on a phone doesn't scramble the desktop layout.
- **Reading order is DOM order.** Tiles render top to bottom, then start to end, after every change, so Tab order and a screen reader's order always match what is on screen. Each tile is a `section` named by its heading (`headingLevel`, `h2` by default), and every pick-up, move, drop, resize, removal and reset is announced in one polite live region (`announcements`).

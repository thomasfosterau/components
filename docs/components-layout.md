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

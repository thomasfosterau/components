<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ItemList from '../../lib/data/ItemList.svelte';
  import LinkListItem from '../../lib/data/LinkListItem.svelte';
  import type { LinkListItemData } from '../../lib/data/list-item.ts';
  import DateTime from '../../lib/formatting/DateTime.svelte';

  const gardens: readonly LinkListItemData[] = [
    {
      id: '1',
      href: '/gardens/1',
      title: 'Back bed',
      subtitle: 'Nine beds, mostly brassicas',
      badges: ['Private'],
    },
    { id: '2', href: '/gardens/2', title: 'Herb spiral', subtitle: 'Six years old' },
    {
      id: '3',
      href: '/gardens/3',
      title: 'Glasshouse',
      subtitle: 'Heated to 12 °C over winter',
      badges: ['Shared', 'Watered'],
    },
    { id: '4', href: '/gardens/4', title: 'Verge planting', subtitle: 'Council-approved' },
  ];

  const { Story } = defineMeta({
    title: 'Data/ItemList',
    component: ItemList,
    parameters: {
      docs: {
        description: {
          component:
            'The container, the keying and the empty state; the row body is the caller’s. `feed` switches to the ARIA feed pattern — `role="feed"`, `aria-posinset`/`aria-setsize` and `aria-busy` — for a stream where only a window of the whole is in the DOM.',
        },
      },
    },
  });
</script>

<Story name="Compact">
  <ItemList items={gardens} getKey={(garden) => garden.id}>
    {#snippet item(garden)}
      <LinkListItem href={garden.href} title={garden.title} badges={garden.badges} />
    {/snippet}
  </ItemList>
</Story>

<Story name="Stacked">
  <ItemList items={gardens} variant="stacked" getKey={(garden) => garden.id}>
    {#snippet item(garden)}
      <LinkListItem
        href={garden.href}
        title={garden.title}
        subtitle={garden.subtitle}
        badges={garden.badges}
      />
    {/snippet}
  </ItemList>
</Story>

<Story name="Grid">
  <ItemList items={gardens} variant="grid" getKey={(garden) => garden.id}>
    {#snippet item(garden)}
      <LinkListItem href={garden.href} title={garden.title} subtitle={garden.subtitle} />
    {/snippet}
  </ItemList>
</Story>

<Story name="Cards, with meta">
  <ItemList items={gardens} variant="cards" getKey={(garden) => garden.id}>
    {#snippet item(garden)}
      <LinkListItem
        href={garden.href}
        title={garden.title}
        subtitle={garden.subtitle}
        badges={garden.badges}
        headingLevel={3}
      >
        {#snippet meta()}
          Last watered <DateTime value="2026-09-14T07:00:00Z" dateStyle="medium" locales="en-AU" />
        {/snippet}
      </LinkListItem>
    {/snippet}
  </ItemList>
</Story>

<Story name="Feed">
  <!-- Turn on the a11y panel: the container is a feed, each entry an article
       that states its position in the whole stream. -->
  <ItemList
    items={gardens}
    variant="cards"
    feed
    busy
    label="Recent gardens"
    getKey={(garden) => garden.id}
  >
    {#snippet item(garden)}
      <LinkListItem
        href={garden.href}
        title={garden.title}
        subtitle={garden.subtitle}
        headingLevel={3}
      />
    {/snippet}
  </ItemList>
</Story>

<Story name="Empty">
  <ItemList
    items={[]}
    getKey={(garden: LinkListItemData) => garden.id}
    emptyMessage="No gardens yet — the first one takes a minute."
  >
    {#snippet item(garden)}
      <LinkListItem href={garden.href} title={garden.title} />
    {/snippet}
  </ItemList>
</Story>

<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import LinkListItem from '../../lib/data/LinkListItem.svelte';
  import DateTime from '../../lib/formatting/DateTime.svelte';

  const { Story } = defineMeta({
    title: 'Data/LinkListItem',
    component: LinkListItem,
    parameters: {
      docs: {
        description: {
          component:
            'The row BODY — never the `<li>` or the `<article>` around it, which is `ItemList`’s decision. The title is the row’s only interactive element: the subtitle and the badges are text beside it, not a second target on the way to the next row.',
        },
      },
    },
  });
</script>

<Story name="Title only">
  <LinkListItem href="/gardens/1" title="Back bed" />
</Story>

<Story name="With a subtitle and badges">
  <LinkListItem
    href="/gardens/1"
    title="Back bed"
    subtitle="Nine beds, mostly brassicas"
    badges={['Private', 'Watered']}
  />
</Story>

<Story name="As a heading, with meta">
  <!-- `headingLevel` is opt-in: twenty `<h3>`s in a filter result is worse for
       heading navigation than none at all. -->
  <LinkListItem
    href="/gardens/3"
    title="Glasshouse"
    subtitle="Heated to 12 °C over winter"
    headingLevel={3}
    badges={['Shared']}
  >
    {#snippet meta()}
      Last watered <DateTime value="2026-09-14T07:00:00Z" dateStyle="medium" locales="en-AU" />
    {/snippet}
  </LinkListItem>
</Story>

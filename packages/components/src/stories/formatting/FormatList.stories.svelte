<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormatList from '../../lib/formatting/FormatList.svelte';

  const { Story } = defineMeta({
    title: 'Formatting/FormatList',
    component: FormatList,
    parameters: {
      docs: {
        description: {
          component:
            'Renders `items` through `Intl.ListFormat.formatToParts`: the `children` snippet renders each element, the locale supplies the literal "and"/", " text.',
        },
      },
    },
  });
</script>

<Story name="Conjunction (and)">
  {#snippet template()}
    <p>
      <FormatList items={['tomatoes', 'basil', 'garlic']}>
        {#snippet children(item)}<strong>{item}</strong>{/snippet}
      </FormatList>
    </p>
  {/snippet}
</Story>

<Story name="Disjunction (or)">
  {#snippet template()}
    <p>
      <FormatList items={['spring', 'summer', 'autumn']} type="disjunction">
        {#snippet children(item)}{item}{/snippet}
      </FormatList>
    </p>
  {/snippet}
</Story>

<Story name="Short style">
  {#snippet template()}
    <p>
      <FormatList items={['NSW', 'VIC', 'QLD', 'WA']} style="short">
        {#snippet children(item)}<code>{item}</code>{/snippet}
      </FormatList>
    </p>
  {/snippet}
</Story>

<Story name="Single item">
  {#snippet template()}
    <p>
      <FormatList items={['tomatoes']}>
        {#snippet children(item)}{item}{/snippet}
      </FormatList>
    </p>
  {/snippet}
</Story>

<Story name="German locale">
  {#snippet template()}
    <p>
      <FormatList items={['Tomaten', 'Basilikum', 'Knoblauch']} locales="de-DE">
        {#snippet children(item)}{item}{/snippet}
      </FormatList>
    </p>
  {/snippet}
</Story>

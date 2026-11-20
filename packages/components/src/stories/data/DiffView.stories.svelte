<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DiffView from '../../lib/data/DiffView.svelte';

  const { Story } = defineMeta({
    title: 'Data/DiffView',
    component: DiffView,
    parameters: {
      docs: {
        description: {
          component:
            'Two texts compared line by line, as a table captioned by its summary. Every changed line starts with a visually hidden “Added:” or “Removed:”, changed words are `<ins>` / `<del>`, and long unchanged runs collapse behind a button. For a sentence or a short field, `DiffText` is enough.',
        },
      },
    },
  });

  const description = {
    before:
      'Basil is a tender annual herb.\nSow seed indoors in early spring.\nPlant out after the last frost.\nPinch out the flower spikes.\n',
    after:
      'Basil is a tender annual herb in the mint family.\nSow seed indoors in late spring.\nPlant out after the last frost.\nPinch out the flower spikes to keep leaves coming.\nHarvest from the top.\n',
  };

  const json = {
    before: JSON.stringify(
      { species: 'Ocimum basilicum', bed: 'Back bed', sown: '2026-09-01', quantity: 12 },
      null,
      2,
    ),
    after: JSON.stringify(
      { species: 'Ocimum basilicum', bed: 'Glasshouse', sown: '2026-09-01', quantity: 18 },
      null,
      2,
    ),
  };

  const long = Array.from({ length: 60 }, (_, index) => `Row ${index + 1}: unchanged`);
  const longAfter = long.map((line, index) =>
    index === 4 || index === 41 ? line.replace('unchanged', 'edited') : line,
  );
</script>

<Story name="Prose revision" asChild>
  <DiffView before={description.before} after={description.after} />
</Story>

<Story name="Side by side" asChild>
  <DiffView before={description.before} after={description.after} layout="split" />
</Story>

<Story name="JSON row" asChild>
  <DiffView before={json.before} after={json.after} mono />
</Story>

<Story name="Long text with collapsed runs" asChild>
  <DiffView before={long.join('\n')} after={longAfter.join('\n')} mono />
</Story>

<Story name="No changes" asChild>
  <DiffView before={description.before} after={description.before} />
</Story>

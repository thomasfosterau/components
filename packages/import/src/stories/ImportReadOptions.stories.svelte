<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ImportReadOptions from '../svelte/ImportReadOptions.svelte';
  import { sampleRegion, semicolonCsv, sourceOf, titledCsv, titledRegion } from './demo.ts';

  /** The read options over a sample CSV: turn the header off, skip rows, or change how the file is read, and watch the preview. */
  const { Story } = defineMeta({
    title: 'Import/ImportReadOptions',
    component: ImportReadOptions,
    tags: ['autodocs'],
  });

  const semicolons = sourceOf('contacts.csv', semicolonCsv);
  const titled = sourceOf('contacts.csv', titledCsv);
</script>

<Story name="With a header row" asChild>
  <ImportReadOptions table={sampleRegion} read={{ headerRow: 0, skipRows: 0 }} />
</Story>

<Story name="Under a title line" asChild>
  <ImportReadOptions table={titledRegion} read={{ headerRow: 0, skipRows: 0 }} />
</Story>

<Story name="Semicolons, with reader options" asChild>
  <ImportReadOptions table={semicolons.table} source={semicolons} read={{ headerRow: 0, skipRows: 0 }} />
</Story>

<Story name="A narrower title line, with reader options" asChild>
  <ImportReadOptions table={titled.table} source={titled} read={{ headerRow: 0, skipRows: 1 }} />
</Story>

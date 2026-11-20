<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ImportMapper from '../svelte/ImportMapper.svelte';
  import type { ImportResult } from '../svelte/index.ts';
  import { contactTarget, formats, pretendToSave } from './demo.ts';

  const { Story } = defineMeta({
    title: 'Import/ImportMapper',
    tags: ['autodocs'],
  });

  /**
   * `records` is typed by the target: this callback reads `name` without a
   * cast, so svelte-check fails here if the type link from `importTarget`
   * to `onSubmit` breaks.
   */
  const saveContacts = async (
    result: ImportResult<typeof contactTarget.schema.Type>,
    signal: AbortSignal,
  ): Promise<void> => {
    const names: readonly string[] = result.records.map((record) => record.name);
    await pretendToSave(names, signal);
  };
</script>

<Story name="Contacts from a CSV" asChild>
  <ImportMapper target={contactTarget} {formats} onSubmit={saveContacts} />
</Story>

<Story name="Rows with issues left out" asChild>
  <ImportMapper target={contactTarget} {formats} onSubmit={saveContacts} invalidRows="exclude" />
</Story>

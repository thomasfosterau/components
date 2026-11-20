<!-- A DialogHost with a descendant that hands its API out, and rows to focus
     and remove: `getDialogs()` has to run during a child's init. -->
<script lang="ts">
  import DialogHost from '../../../src/lib/feedback/DialogHost.svelte';
  import type { DialogsApi } from '../../../src/lib/feedback/dialogs.ts';
  import DialogsProbe from './DialogsProbe.svelte';

  interface Props {
    onReady: (api: DialogsApi) => void;
    confirmLabel?: string | undefined;
  }

  let { onReady, confirmLabel }: Props = $props();

  let rows = $state(['Bed 4', 'Bed 5']);
  let tools = $state(true);

  /** Removes the toolbar, so nothing focusable is left above its button. */
  export const hideTools = (): void => {
    tools = false;
  };

  /** Removes a row, as a confirmed delete would. */
  export const remove = (name: string): void => {
    rows = rows.filter((row) => row !== name);
  };
</script>

<DialogHost {confirmLabel}>
  <DialogsProbe {onReady} />
  <main>
    {#if tools}
      <div><button type="button">Tool</button></div>
    {/if}
    <ul tabindex="-1" aria-label="Beds">
      {#each rows as row (row)}
        <li><button type="button">Delete {row}</button></li>
      {/each}
    </ul>
  </main>
</DialogHost>

<script lang="ts">
  import { getToaster } from '../../../src/lib/feedback/toaster.ts';

  interface Props {
    durationMs?: number | undefined;
  }

  let { durationMs }: Props = $props();

  const toaster = getToaster();
  let lastId = $state<number | undefined>(undefined);
  let count = 0;
</script>

<p data-testid="last-id">{lastId ?? 'none'}</p>

<button
  type="button"
  onclick={() => {
    count += 1;
    lastId = toaster.add(
      { title: `Bed ${count} saved`, description: 'Every plant in it moved with it.', tone: 'success' },
      durationMs,
    );
  }}
>
  Push a toast
</button>

<button
  type="button"
  onclick={() => {
    if (lastId !== undefined) toaster.dismiss(lastId);
  }}
>
  Dismiss the last toast
</button>

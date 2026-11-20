<script lang="ts">
  import { getToaster, type ToastOutcome } from '../../../src/lib/feedback/toaster.ts';

  interface Props {
    durationMs?: number | undefined;
    onAction?: ((signal: AbortSignal) => void | Promise<void>) | undefined;
  }

  let { durationMs, onAction = () => {} }: Props = $props();

  const toaster = getToaster();
  let lastId = $state<number | undefined>(undefined);
  let outcome = $state<ToastOutcome | undefined>(undefined);
  let count = 0;

  const track = async (id: number): Promise<void> => {
    lastId = id;
    outcome = undefined;
    const ended = await toaster.result(id);
    if (lastId === id) outcome = ended;
  };
</script>

<p data-testid="last-id">{lastId ?? 'none'}</p>
<p data-testid="outcome">{outcome ?? 'pending'}</p>

<button
  type="button"
  onclick={() => {
    count += 1;
    void track(
      toaster.add(
        { title: `Bed ${count} saved`, description: 'Every plant in it moved with it.', tone: 'success' },
        durationMs,
      ),
    );
  }}
>
  Push a toast
</button>

<button
  type="button"
  onclick={() => {
    count += 1;
    void track(
      toaster.add(
        { title: `Bed ${count} deleted`, action: { label: 'Undo', onAction: (signal) => onAction(signal) } },
        durationMs,
      ),
    );
  }}
>
  Push an action toast
</button>

<button
  type="button"
  onclick={() => {
    if (lastId !== undefined) toaster.dismiss(lastId);
  }}
>
  Dismiss the last toast
</button>

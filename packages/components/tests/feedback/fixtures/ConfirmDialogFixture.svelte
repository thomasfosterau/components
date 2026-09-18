<!-- ConfirmDialog in whichever mode the test asks for. The default context
     navigates by assigning `window.location`, which would take the test runner
     with it — so the fixture injects its own `navigate`. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import ConfirmDialog from '../../../src/lib/feedback/ConfirmDialog.svelte';
  import type { ConfirmForm } from '../../../src/lib/feedback/ConfirmDialog.svelte';
  import Button from '../../../src/lib/ui/Button.svelte';

  interface Props {
    open?: boolean;
    onConfirm?: (() => Promise<unknown>) | undefined;
    form?: ConfirmForm | undefined;
    redirectTo?: string | undefined;
    onNavigate?: ((url: string) => void) | undefined;
    confirmLabel?: string | undefined;
    failureMessage?: string | undefined;
  }

  let {
    open = $bindable(false),
    onConfirm,
    form,
    redirectTo,
    onNavigate,
    confirmLabel,
    failureMessage,
  }: Props = $props();

  setComponentsContext({ navigate: (url) => onNavigate?.(url) });
</script>

<p data-testid="open-state">{open ? 'open' : 'closed'}</p>

<ConfirmDialog
  bind:open
  title="Delete this garden?"
  description="Every bed and plant in it goes too."
  {onConfirm}
  {form}
  {redirectTo}
  {confirmLabel}
  {failureMessage}
>
  {#snippet trigger({ props })}
    <Button {...props} tone="error">Delete garden</Button>
  {/snippet}
  <p data-testid="body">This cannot be undone.</p>
</ConfirmDialog>

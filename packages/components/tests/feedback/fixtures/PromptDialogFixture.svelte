<!-- A PromptDialog opened from a trigger button, with the open state shown
     so a test can tell whether it closed. Form mode catches the submit. -->
<script lang="ts">
  import PromptDialog from '../../../src/lib/feedback/PromptDialog.svelte';

  interface Props {
    value?: string | undefined;
    validate?:
      | ((value: string, signal: AbortSignal) => readonly string[] | Promise<readonly string[]>)
      | undefined;
    requireMatch?: string | undefined;
    onConfirm?: ((value: string, signal: AbortSignal) => void | Promise<void>) | undefined;
    formMode?: boolean | undefined;
    onSubmitted?: ((data: FormData, form: HTMLFormElement) => void) | undefined;
  }

  let { value, validate, requireMatch, onConfirm, formMode = false, onSubmitted }: Props =
    $props();

  let open = $state(false);
</script>

<svelte:document
  onsubmit={(event) => {
    if (!formMode || !(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    onSubmitted?.(new FormData(event.target), event.target);
  }}
/>

<PromptDialog
  bind:open
  title="Rename bed"
  label="Name"
  {value}
  {validate}
  {requireMatch}
  {onConfirm}
  form={formMode ? { action: '/beds/4?/rename', name: 'name' } : undefined}
  confirmLabel="Rename"
>
  {#snippet trigger({ props })}
    <button {...props} type="button">Rename…</button>
  {/snippet}
</PromptDialog>
<p data-testid="open-state">{open ? 'open' : 'closed'}</p>

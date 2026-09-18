<script lang="ts">
  import Button from '../../../src/lib/ui/Button.svelte';
  import FormActions from '../../../src/lib/forms/FormActions.svelte';

  interface Props {
    submitLabel?: string | undefined;
    pendingLabel?: string | undefined;
    pending?: boolean | undefined;
    disabled?: boolean | undefined;
    cancelHref?: string | undefined;
    cancelLabel?: string | undefined;
    extra?: boolean | undefined;
    onSubmitted?: (() => void) | undefined;
  }

  let {
    submitLabel,
    pendingLabel,
    pending,
    disabled,
    cancelHref,
    cancelLabel,
    extra = false,
    onSubmitted,
  }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.();
  }}
>
  <input type="text" aria-label="Garden name" />
  <FormActions {submitLabel} {pendingLabel} {pending} {disabled} {cancelHref} {cancelLabel}>
    {#if extra}
      <Button variant="ghost">Save as a draft</Button>
    {/if}
  </FormActions>
</form>

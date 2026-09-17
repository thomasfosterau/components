<!-- A dialog with a trigger, two focusable body controls (so Tab has
     somewhere to cycle) and an action row, plus a rendered copy of the
     bindable `open` the test can read. -->
<script lang="ts">
  import Dialog from '../../../src/lib/feedback/Dialog.svelte';
  import Button from '../../../src/lib/ui/Button.svelte';

  interface Props {
    open?: boolean;
    title?: string;
    withDescription?: boolean;
    closeLabel?: string | undefined;
  }

  let {
    open = $bindable(false),
    title = 'Move this plant?',
    withDescription = true,
    closeLabel,
  }: Props = $props();

  const description = $derived(withDescription ? 'It keeps its history.' : undefined);
</script>

<p data-testid="open-state">{open ? 'open' : 'closed'}</p>

<Dialog bind:open {title} {description} {closeLabel}>
  {#snippet trigger({ props })}
    <Button {...props}>Move plant</Button>
  {/snippet}
  <label>
    Note
    <input type="text" name="note" />
  </label>
  {#snippet actions({ close })}
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button tone="primary" onclick={close}>Move it</Button>
  {/snippet}
</Dialog>

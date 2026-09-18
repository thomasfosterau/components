<script lang="ts">
  import Popover from '../../../src/lib/ui/Popover.svelte';

  interface Props {
    title?: string | undefined;
    triggerLabel: string;
    closeLabel?: string | undefined;
  }

  let { title, triggerLabel, closeLabel }: Props = $props();
</script>

<Popover {title} {closeLabel}>
  {#snippet trigger({ props })}
    <button {...props} type="button">{triggerLabel}</button>
  {/snippet}
  <p>Body of the panel.</p>
  <button type="button">Apply</button>
</Popover>

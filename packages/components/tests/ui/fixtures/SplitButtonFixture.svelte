<script lang="ts">
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
  import SplitButton from '../../../src/lib/ui/SplitButton.svelte';

  interface Props {
    onSave?: (() => void) | undefined;
    onDraft?: (() => void) | undefined;
    primaryDisabled?: boolean | undefined;
    loading?: boolean | undefined;
  }

  let { onSave, onDraft, primaryDisabled, loading }: Props = $props();
</script>

<SplitButton
  tone="primary"
  menuLabel="More save options"
  onclick={onSave}
  {primaryDisabled}
  {loading}
>
  Save
  {#snippet menu()}
    <MenuItem onSelect={onDraft}>Save as draft</MenuItem>
    <MenuItem>Save and publish</MenuItem>
  {/snippet}
</SplitButton>
<button type="button">Next</button>

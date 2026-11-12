<script lang="ts">
  import SaveBar from '../../../src/lib/forms/SaveBar.svelte';

  interface Props {
    dirty: boolean;
    confirmDiscard?: boolean | undefined;
    onSubmitted?: (() => void) | undefined;
    onDiscard?: (() => void) | undefined;
  }

  let { dirty = $bindable(), confirmDiscard, onSubmitted, onDiscard }: Props = $props();
</script>

<form
  id="edit-bed"
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.();
    dirty = false;
  }}
>
  <input type="text" aria-label="Bed name" oninput={() => (dirty = true)} />
</form>
<SaveBar {dirty} form="edit-bed" {confirmDiscard} {onDiscard} />

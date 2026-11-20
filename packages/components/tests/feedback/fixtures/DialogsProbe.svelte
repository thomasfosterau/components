<script lang="ts">
  import { getDialogs, type DialogsApi } from '../../../src/lib/feedback/dialogs.ts';

  let { onReady }: { onReady: (api: DialogsApi) => void } = $props();

  // svelte-ignore state_referenced_locally
  onReady(getDialogs());
</script>

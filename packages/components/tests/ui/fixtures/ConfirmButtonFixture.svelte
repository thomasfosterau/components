<!-- The default context navigates by assigning `window.location`, which would
     take the test runner with it — so the fixture injects its own. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import ConfirmButton from '../../../src/lib/ui/ConfirmButton.svelte';

  interface Props {
    action: () => Promise<unknown>;
    redirectTo?: string | undefined;
    onNavigate?: ((url: string) => void) | undefined;
    idleLabel?: string | undefined;
    failureMessage?: string | undefined;
  }

  let { action, redirectTo, onNavigate, idleLabel, failureMessage }: Props = $props();

  setComponentsContext({ navigate: (url) => onNavigate?.(url) });
</script>

<ConfirmButton {action} {redirectTo} {idleLabel} {failureMessage} />

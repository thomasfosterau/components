<!-- The unhappy path of `getHotkeyRegistry()`: a component that calls it with no
     registry created above. The call throws during initialisation, so the test
     wraps `render()` in `expect(...).rejects`. -->
<script lang="ts">
  import { getHotkeyRegistry } from '../../../src/lib/hotkeys/context.svelte.ts';

  // No `createHotkeyRegistry()` ancestor — this throws on mount.
  getHotkeyRegistry();
</script>

<div>unreachable</div>

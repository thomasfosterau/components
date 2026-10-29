<!-- Two Disclosures sharing a `name`: the browser keeps at most one open. -->
<script lang="ts">
  import Disclosure from '../../../src/lib/ui/Disclosure.svelte';
</script>

<Disclosure name="care" title="First">First body.</Disclosure>
<Disclosure name="care" title="Second">Second body.</Disclosure>

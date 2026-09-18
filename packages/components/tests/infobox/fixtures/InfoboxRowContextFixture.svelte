<!--
  Test fixture: mounts `InfoboxRow` under a components context whose `href`
  resolver rewrites the path, so a test can tell "resolved through the
  context" apart from "rendered the raw href" without spying on `Link`.
-->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import InfoboxRow from '../../../src/lib/infobox/InfoboxRow.svelte';

  setComponentsContext({ href: (path) => `/en${path}` });
</script>

<dl>
  <InfoboxRow label="Genus" value="Solanum" href="/taxa/solanum" />
</dl>

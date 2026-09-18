<!--
  Test fixture: an `Infobox` built from a `rows` array containing a `links`
  row, under a components context whose `href` resolver rewrites the path —
  the `rows` convenience must resolve exactly like the composed primitives.
-->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Infobox from '../../../src/lib/infobox/Infobox.svelte';

  setComponentsContext({ href: (path) => `/en${path}` });
</script>

<Infobox
  title="Grayndler"
  rows={[
    {
      kind: 'links',
      label: 'Member',
      links: [{ label: 'Anthony Albanese', href: '/people/albanese' }],
    },
  ]}
/>

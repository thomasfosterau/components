<!-- A `Pagination` under an app-supplied context, to prove hrefs go through
     `ComponentsContext.href` rather than being rendered raw. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Pagination from '../../../src/lib/data/Pagination.svelte';

  setComponentsContext({ href: (path) => `/en${path}`, locale: () => 'en-AU' });
</script>

<Pagination offset={20} limit={20} total={151} href={(offset) => `/p?offset=${offset}`} />

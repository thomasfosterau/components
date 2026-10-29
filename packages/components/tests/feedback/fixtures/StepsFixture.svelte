<!-- Sets a components context whose `href` prefixes `/app`, so link mode can
     be asserted to resolve through it; `dir` wraps the list for RTL. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Steps from '../../../src/lib/feedback/Steps.svelte';
  import type { StepItem } from '../../../src/lib/feedback/Steps.svelte';

  interface Props {
    items: readonly StepItem[];
    dir?: 'ltr' | 'rtl' | undefined;
  }

  let { items, dir = 'ltr' }: Props = $props();

  setComponentsContext({ href: (path) => `/app${path}` });
</script>

<div {dir} class="w-96">
  <Steps {items} label="Wizard" current={1} class="w-full" />
</div>

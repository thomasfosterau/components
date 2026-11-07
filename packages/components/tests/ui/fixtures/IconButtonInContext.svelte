<!-- An IconButton under a components context that prefixes hrefs with
     `/base` and treats `/base/` as the current page. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import IconButton from '../../../src/lib/ui/IconButton.svelte';

  interface Props {
    label: string;
    href: string;
  }

  let { label, href }: Props = $props();

  setComponentsContext({
    href: (path) => `/base${path}`,
    isCurrent: (resolved) => resolved === '/base/',
  });
</script>

{#snippet icon()}
  <svg viewBox="0 0 16 16"><path d="M2 2l12 12" /></svg>
{/snippet}

<IconButton {label} {href} {icon} />

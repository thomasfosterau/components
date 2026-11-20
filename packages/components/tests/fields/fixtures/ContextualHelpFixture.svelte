<script lang="ts">
  import ContextualHelp from '../../../src/lib/fields/ContextualHelp.svelte';

  interface Props {
    variant?: 'info' | 'help' | undefined;
    triggerLabel?: string | undefined;
  }

  let { variant, triggerLabel }: Props = $props();
</script>

<ContextualHelp
  title="Hardiness zone"
  {variant}
  {triggerLabel}
  learnMore={{ href: 'https://example.com/zones', label: 'Read about zones' }}
>
  The coldest winter your plants can survive, by region.
</ContextualHelp>

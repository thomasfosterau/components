<script lang="ts">
  import Swap from '../../../src/lib/ui/Swap.svelte';
  import type { SwapEffect } from '../../../src/lib/ui/tones.ts';

  interface Props {
    active?: boolean | 'indeterminate' | undefined;
    effect?: SwapEffect | undefined;
    withIndeterminate?: boolean | undefined;
  }

  let { active, effect, withIndeterminate = false }: Props = $props();
</script>

{#snippet on()}<span>Pause</span>{/snippet}
{#snippet off()}<span>Play</span>{/snippet}
{#snippet mixed()}<span>Some</span>{/snippet}

<Swap {active} {effect} {on} {off} indeterminate={withIndeterminate ? mixed : undefined} data-testid="swap" />

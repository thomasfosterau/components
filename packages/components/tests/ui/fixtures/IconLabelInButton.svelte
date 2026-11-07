<!-- An IconLabel inside a real button, to check the button's name. -->
<script lang="ts">
  import IconLabel from '../../../src/lib/ui/IconLabel.svelte';
  import type { IconLabelStyle } from '../../../src/lib/ui/tones.ts';

  interface Props {
    title: string;
    labelStyle?: IconLabelStyle | undefined;
  }

  let { title, labelStyle }: Props = $props();
</script>

{#snippet icon()}
  <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" /></svg>
{/snippet}

<button type="button"><IconLabel {title} {labelStyle} {icon} /></button>

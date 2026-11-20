<!-- An Image with its bindable phase written out, for the test to read. -->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Image from '../../../src/lib/media/Image.svelte';
  import type { ImagePhase } from '../../../src/lib/media/image-placeholder.ts';

  let props: ComponentProps<typeof Image> = $props();
  let phase = $state<ImagePhase>('loading');
</script>

<p data-testid="phase">{phase}</p>
<Image {...props} bind:phase />

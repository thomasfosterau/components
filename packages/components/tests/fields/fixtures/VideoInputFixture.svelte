<script lang="ts">
  import VideoInput from '../../../src/lib/fields/VideoInput.svelte';

  interface Props {
    /** What the "caller's upload" reports the moment a file is chosen. */
    startAt?: number | undefined;
    maxBytes?: number | undefined;
    tooLargeMessage?: string | undefined;
  }

  let { startAt = 42, maxBytes, tooLargeMessage }: Props = $props();

  let file = $state<File | undefined>();
  let progress = $state(0);
</script>

<VideoInput
  aria-label="Video"
  accept="text/plain"
  progressLabel="Uploading the video"
  data-testid="file"
  {maxBytes}
  {tooLargeMessage}
  bind:file
  bind:progress
  onSelect={() => (progress = startAt)}
/>

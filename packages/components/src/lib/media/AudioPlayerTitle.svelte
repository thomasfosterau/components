<!-- @component
`AudioPlayer`'s heading row: artwork, title and artist.
-->
<script lang="ts">
  interface Props {
    /** The recording's title. */
    title: string;
    /** Who made it. */
    artist?: string | undefined;
    /** Cover image URL; decorative, since the title names it. */
    artwork?: string | undefined;
  }

  let { title, artist, artwork }: Props = $props();
</script>

<div class="flex items-center gap-3">
  {#if artwork !== undefined}
    <img src={artwork} alt="" class="rounded-field size-12 object-cover" />
  {/if}
  <div class="min-w-0">
    <p class="truncate font-medium">{title}</p>
    {#if artist !== undefined}
      <p class="text-base-content/70 truncate text-sm">{artist}</p>
    {/if}
  </div>
</div>

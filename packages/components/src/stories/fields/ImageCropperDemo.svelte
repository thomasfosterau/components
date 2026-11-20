<script lang="ts">
  import ImageCropper from '../../lib/fields/ImageCropper.svelte';
  import type { CropArea } from '../../lib/fields/crop.ts';

  interface Props {
    aspect?: number | undefined;
    round?: boolean | undefined;
    straighten?: boolean | undefined;
  }

  let { aspect = 1, round = false, straighten = false }: Props = $props();

  // A self-contained landscape, so the story needs no network.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ab8e8"/><stop offset="1" stop-color="#e8f2fa"/></linearGradient></defs>
    <rect width="1200" height="800" fill="url(#sky)"/>
    <circle cx="900" cy="200" r="80" fill="#f6d365"/>
    <path d="M0 560 L260 330 L460 520 L700 280 L1000 540 L1200 420 L1200 800 L0 800 Z" fill="#4c7a5a"/>
    <path d="M0 640 Q300 560 600 650 T1200 620 L1200 800 L0 800 Z" fill="#2f5d3f"/>
  </svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  let area: CropArea | undefined = $state();
</script>

<div class="max-w-md space-y-3">
  <ImageCropper {src} {aspect} {round} {straighten} bind:area />
  {#if area}
    <p class="text-base-content/70 text-sm">
      Crop: {Math.round(area.width)} × {Math.round(area.height)} at ({Math.round(area.x)}, {Math.round(area.y)}),
      turned {area.rotation}°, straightened {area.straighten}°
    </p>
  {/if}
</div>

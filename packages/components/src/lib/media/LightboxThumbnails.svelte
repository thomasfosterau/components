<!-- @component
`Lightbox`'s list of thumbnail buttons. Internal: not exported.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { LightboxImage } from './Lightbox.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
    images: readonly LightboxImage[];
    /** Names a thumbnail button from its image's `alt`. */
    label: (alt: string) => string;
    /** Called with the position of the thumbnail pressed. */
    onOpen: (index: number) => void;
  }

  let { images, label, onOpen, class: className, ...rest }: Props = $props();
</script>

<ul {...rest} class={['flex flex-wrap gap-2', className]}>
  {#each images as image, i (i)}
    <li>
      <button
        type="button"
        class="rounded-field focus-visible:outline-primary block cursor-zoom-in overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={label(image.alt)}
        onclick={() => onOpen(i)}
      >
        <img
          src={image.thumbnailSrc ?? image.src}
          alt=""
          width={image.width}
          height={image.height}
          loading="lazy"
          class="block h-24 w-auto object-cover"
        />
      </button>
    </li>
  {/each}
</ul>

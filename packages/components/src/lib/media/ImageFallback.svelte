<!-- @component
The box `Image` shows when it fails to load; internal, not exported.
-->
<script lang="ts">
  import { ImageOff } from '@lucide/svelte';
  import type { ClassValue } from 'svelte/elements';
  import Button from '../ui/Button.svelte';

  interface Props {
    alt: string;
    errorLabel: string;
    retryLabel: string;
    retry: (() => void) | undefined;
    width: number | string | undefined;
    height: number | string | undefined;
    class: ClassValue | null | undefined;
  }

  let { alt, errorLabel, retryLabel, retry, width, height, class: className }: Props = $props();

  /** A CSS length for a `width` attribute value. */
  const length = (value: number | string | undefined): string | undefined =>
    value === undefined ? undefined : /^\d+(\.\d+)?$/.test(String(value)) ? `${value}px` : String(value);
  const ratio = $derived(Number(width) > 0 && Number(height) > 0 ? `${width} / ${height}` : undefined);
</script>

<!-- A decorative image's failure says nothing: the box only keeps the layout. -->
<span
  data-image-fallback
  aria-hidden={alt === '' ? 'true' : undefined}
  class={[
    'bg-base-200 border-base-300 text-base-content/70 rounded-box inline-flex max-w-full flex-col items-center justify-center gap-2 border p-4 text-center text-sm',
    className,
  ]}
  style:width={length(width)}
  style:aspect-ratio={ratio}
>
  <ImageOff class="size-6" aria-hidden="true" />
  {#if alt !== ''}
    <span class="text-base-content font-medium">{alt}</span>
    <span>{errorLabel}</span>
    {#if retry}
      <Button size="sm" variant="outline" onclick={retry}>{retryLabel}</Button>
    {/if}
  {/if}
</span>

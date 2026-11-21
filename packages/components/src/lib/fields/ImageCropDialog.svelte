<!-- @component
`ImageInput`'s crop step: an `ImageCropper` in a `Dialog` with Apply and Cancel. Internal.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import Dialog from '../feedback/Dialog.svelte';
  import Button from '../ui/Button.svelte';
  import type { CropArea } from './crop.ts';
  import type { CropExportOptions } from './crop-export.ts';
  import ImageCropper from './ImageCropper.svelte';

  interface Props {
    open: boolean;
    src: Blob;
    /** The crop to reopen, if any. */
    area: CropArea | undefined;
    aspect: number | undefined;
    round: boolean | undefined;
    straighten: boolean | undefined;
    encode: CropExportOptions;
    title: string;
    applyLabel: string;
    cancelLabel: string;
    finalFocus: () => HTMLElement | null | undefined;
    onApply: (area: CropArea, blob: Blob) => void;
  }

  let {
    open = $bindable(),
    src,
    area,
    aspect,
    round,
    straighten,
    encode,
    title,
    applyLabel,
    cancelLabel,
    finalFocus,
    onApply,
  }: Props = $props();

  // A draft, so Cancel leaves the applied crop as it was; each opening starts from it.
  let draft = $state<CropArea | undefined>();
  $effect.pre(() => {
    if (open) {
      draft = untrack(() => area);
    }
  });
  let api = $state<{ toBlob(options?: CropExportOptions): Promise<Blob> } | undefined>();
  let busy = $state(false);

  const apply = async (close: () => void): Promise<void> => {
    if (draft === undefined || api === undefined) {
      return;
    }
    busy = true;
    try {
      onApply(draft, await api.toBlob(encode));
      close();
    } finally {
      busy = false;
    }
  };
</script>

<Dialog bind:open {title} closeLabel={cancelLabel} size="lg" {finalFocus}>
  <!-- Narrow enough that a tall frame leaves the controls and buttons on screen. -->
  <ImageCropper
    {src}
    {aspect}
    {round}
    {straighten}
    bind:area={draft}
    bind:api
    class="mx-auto"
    style="width: min(100%, calc(50svh * {aspect ?? 1}))"
  />
  {#snippet actions({ close })}
    <Button variant="ghost" disabled={busy} onclick={close}>{cancelLabel}</Button>
    <Button
      tone="primary"
      loading={busy}
      disabled={draft === undefined}
      onclick={() => void apply(close)}
    >
      {applyLabel}
    </Button>
  {/snippet}
</Dialog>

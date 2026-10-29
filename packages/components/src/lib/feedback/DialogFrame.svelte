<!-- @component
The modal body `Dialog` and `Drawer` share; internal, not exported.
-->
<!--
  DialogFrame — one implementation of everything that makes a modal a
  modal, on bits-ui's `Dialog`: the trigger, overlay, focus trap and
  return, Escape, scroll lock, the title and description wiring, the
  labelled close button and the `actions({ close })` row. `Dialog` (a
  centred `modal-box`) and `Drawer` (a panel at an edge) differ only in
  `layout` and the content classes they pass, so the two cannot drift on
  focus, dismissal or labelling.

  `hideTitle` keeps the title as the accessible name but hides it
  visually: a mobile navigation drawer needs a name, not a heading.
-->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { Dialog } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import Button from '../ui/Button.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';

  interface Props {
    open?: boolean | undefined;
    title: string;
    description?: string | undefined;
    closeLabel: string;
    hideTitle?: boolean | undefined;
    /** `modal`: daisyUI `modal-box` flow. `sheet`: a column with a scrolling body and a pinned footer. */
    layout: 'modal' | 'sheet';
    contentClass: ClassValue;
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
    actions?: Snippet<[{ close: () => void }]> | undefined;
    children: Snippet<[]>;
  }

  let {
    open = $bindable(false),
    title,
    description,
    closeLabel,
    hideTitle = false,
    layout,
    contentClass,
    trigger,
    actions,
    children,
  }: Props = $props();

  const close = (): void => {
    open = false;
  };
  const sheet = $derived(layout === 'sheet');
</script>

<Dialog.Root bind:open>
  {#if trigger}
    <Dialog.Trigger>
      {#snippet child({ props })}
        {@render trigger({ props })}
      {/snippet}
    </Dialog.Trigger>
  {/if}
  <Dialog.Portal>
    <!-- daisyUI's `modal-backdrop` is a child of an open `.modal`; this is
         the same scrim as an element bits-ui can animate and dismiss from. -->
    <Dialog.Overlay class="bg-base-300/60 fixed inset-0 z-40" />
    <Dialog.Content class={contentClass}>
      <div class={['flex items-start justify-between gap-4', sheet && 'px-4 pt-4']}>
        <Dialog.Title class={hideTitle ? 'sr-only' : 'text-lg font-semibold'}>{title}</Dialog.Title>
        <Dialog.Close>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="sm" class="btn-square -mt-1 -mr-1 ms-auto">
              <X class="size-4" aria-hidden="true" />
              <VisuallyHidden>{closeLabel}</VisuallyHidden>
            </Button>
          {/snippet}
        </Dialog.Close>
      </div>
      {#if description !== undefined}
        <Dialog.Description class={['text-base-content/70 mt-1 text-sm leading-6', sheet && 'px-4']}>
          {description}
        </Dialog.Description>
      {/if}
      <div class={sheet ? 'min-h-0 flex-1 overflow-y-auto p-4' : 'py-4'}>{@render children()}</div>
      {#if actions}
        <div class={sheet ? 'border-base-300 flex justify-end gap-2 border-t p-4' : 'modal-action'}>
          {@render actions({ close })}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<!-- @component
A modal on bits-ui’s `Dialog`, wearing daisyUI’s `modal-box`.
-->
<!--
  Dialog — a modal on bits-ui's `Dialog`, wearing daisyUI's `modal-box`.

  ARIA contract: everything that makes a modal a modal is bits-ui's — the
  focus trap, the initial focus move, `aria-modal`, the `aria-labelledby` /
  `aria-describedby` wiring to `Dialog.Title` and `Dialog.Description`,
  Escape and outside-click dismissal, the scroll lock, and returning focus
  to whatever opened it. None of that is re-implemented here, because the
  hand-rolled version is the one that is always subtly wrong: the native
  `<dialog>` the app repos used gets the trap right but leaves the title
  wiring and the focus return to the call site, and every call site did it
  differently.

  `title` is required: a dialog with no accessible name is announced as
  "dialog" and nothing else. `description` is optional but is what turns
  "Delete garden?" into a sentence an assistive-technology user can act on.

  `trigger` receives the props to spread, so an existing `Button` keeps its
  own markup and its own accessible name; `actions` receives `close`, so the
  action row's buttons can dismiss without reaching for the bindable `open`.
-->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { Dialog } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import Button from '../ui/Button.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import { dialogSize, type DialogSize } from './sizes.ts';

  interface Props {
    /** Whether the dialog is shown. Bindable. */
    open?: boolean | undefined;
    /** Heading — the dialog's accessible name. */
    title: string;
    /** Supporting line under the heading — the accessible description. */
    description?: string | undefined;
    /**
     * Accessible name of the corner close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * Width step of the `modal-box`.
     * @defaultValue `'md'`
     */
    size?: DialogSize | undefined;
    /** Extra classes on the `modal-box`. */
    class?: string | undefined;
    /** The opening control — the caller's own element, spreading `props`. */
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
    /** Buttons for the `modal-action` row. */
    actions?: Snippet<[{ close: () => void }]> | undefined;
    /** The dialog body, under the title and description. */
    children: Snippet<[]>;
  }

  let {
    open = $bindable(false),
    title,
    description,
    closeLabel = 'Close',
    size = 'md',
    class: className,
    trigger,
    actions,
    children,
  }: Props = $props();

  const close = (): void => {
    open = false;
  };
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
    <Dialog.Content
      class={[
        'modal-box fixed top-1/2 left-1/2 z-50 max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
        dialogSize[size],
        className,
      ]}
    >
      <div class="flex items-start justify-between gap-4">
        <Dialog.Title class="text-lg font-semibold">{title}</Dialog.Title>
        <Dialog.Close>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="sm" class="btn-square -mt-1 -mr-1">
              <X class="size-4" aria-hidden="true" />
              <VisuallyHidden>{closeLabel}</VisuallyHidden>
            </Button>
          {/snippet}
        </Dialog.Close>
      </div>
      {#if description !== undefined}
        <Dialog.Description class="text-base-content/70 mt-1 text-sm leading-6">
          {description}
        </Dialog.Description>
      {/if}
      <div class="py-4">{@render children()}</div>
      {#if actions}
        <div class="modal-action">{@render actions({ close })}</div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

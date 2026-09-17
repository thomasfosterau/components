<script lang="ts">
  import { clsx } from 'clsx';
  import { Dialog } from 'melt/builders';
  import type { Snippet } from 'svelte';

  type TriggerAttrs = Dialog['trigger'];

  type Props = {
    /** Whether the dialog is open. Bindable. */
    open?: boolean;
    title?: string;
    description?: string;
    /** Label for the built-in trigger button. Ignored when `trigger` is given. */
    triggerLabel?: string;
    /** Replaces the built-in trigger button. Spread the given attributes onto your own element. */
    trigger?: Snippet<[TriggerAttrs]>;
    /** Dialog body. */
    children?: Snippet;
    /** Replaces the built-in footer. Receives a `close` callback. */
    footer?: Snippet<[() => void]>;
    triggerClass?: string;
    overlayClass?: string;
    contentClass?: string;
    titleClass?: string;
    descriptionClass?: string;
  };

  let {
    open = $bindable(false),
    title = '',
    description = '',
    triggerLabel = 'Open dialog',
    trigger,
    children,
    footer,
    triggerClass = '',
    overlayClass = '',
    contentClass = '',
    titleClass = '',
    descriptionClass = ''
  }: Props = $props();

  const dialog = new Dialog({
    open: () => open,
    onOpenChange: (value) => (open = value)
  });

  const close = () => (dialog.open = false);

  const buttonBase =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2';
</script>

{#if trigger}
  {@render trigger(dialog.trigger)}
{:else}
  <button
    {...dialog.trigger}
    class={clsx(
      buttonBase,
      'bg-slate-900 text-slate-50 hover:bg-slate-800 focus-visible:ring-slate-950',
      triggerClass
    )}
  >
    {triggerLabel}
  </button>
{/if}

<div
  {...dialog.overlay}
  class={clsx(
    'fixed inset-0 z-50 bg-black/50',
    'opacity-0 transition-opacity transition-discrete duration-150',
    'data-[open]:opacity-100 starting:data-[open]:opacity-0',
    overlayClass
  )}
></div>

<dialog
  {...dialog.content}
  aria-label={title || undefined}
  class={clsx(
    'fixed top-1/2 left-1/2 z-50 m-0 max-h-[85vh] w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2',
    'rounded-lg bg-white p-6 text-slate-900 shadow-lg focus:outline-none',
    '[&::backdrop]:bg-transparent',
    'opacity-0 transition-opacity transition-discrete duration-150',
    'data-[open]:opacity-100 starting:data-[open]:opacity-0',
    contentClass
  )}
>
  {#if title}
    <h2 class={clsx('mb-2 text-lg font-semibold text-slate-900', titleClass)}>{title}</h2>
  {/if}

  {#if description}
    <p class={clsx('mb-4 text-sm text-slate-600', descriptionClass)}>{description}</p>
  {/if}

  <div class="mb-4">
    {@render children?.()}
  </div>

  <div class="flex justify-end gap-2">
    {#if footer}
      {@render footer(close)}
    {:else}
      <button
        type="button"
        onclick={close}
        class={clsx(
          buttonBase,
          'border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400'
        )}
      >
        Close
      </button>
    {/if}
  </div>
</dialog>

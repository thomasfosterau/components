<!--
  Tip — one piece of inline guidance: a title, an optional sentence, and the
  actions it offers. Shows itself only if the store says it may, records that
  it did, and closes for good when the reader dismisses it or takes an
  action.

  A daisyUI `alert` rather than a hand-rolled card — no hard-coded colours, no
  hand-drawn arrow (that belongs to `PopoverTip`, where a tip is actually
  anchored to something an arrow can point at; an inline tip sits in the flow
  and has nothing to point at).

  `role="status"` with `aria-live="polite"`: a tip is an offer, not an
  interruption, so it is announced at the next pause rather than immediately.

  The Escape-to-dismiss listener is hand-rolled rather than left to bits-ui:
  this component has no bits-ui primitive backing it (it is a plain `alert`,
  not a dialog or popover), and the key has to be scoped to "only the topmost
  tip on the page" via the shared `TipStack` — a concern bits-ui's own
  Escape handling knows nothing about. `PopoverTip` wires the same stack into
  its bits-ui `Popover` instead, once there is a floating layer to hand it to.
-->
<script lang="ts">
  import { soloTipStack, type TipStack } from './tip-stack.ts';
  import type { TipStore } from './tip-store.svelte.ts';
  import type { TipAction, TipConfig } from './types.ts';

  interface Props {
    config: TipConfig;
    /** The store that decides whether this shows and remembers that it did. */
    store: TipStore;
    /** Shared with the page's other tips so Escape closes only the top one. */
    stack?: TipStack;
    /** Accessible name of the dismiss button. */
    dismissLabel?: string;
    class?: string;
  }

  let {
    config,
    store,
    stack = soloTipStack,
    dismissLabel = 'Dismiss',
    class: className,
  }: Props = $props();

  let visible = $state(false);

  // The decision is made on mount, not during render: `markShown` writes, and a
  // write inside a derivation would run again on every re-render.
  $effect(() => {
    if (!store.shouldDisplay(config.id)) return;
    visible = true;
    store.markShown(config.id);
  });

  $effect(() => {
    if (!visible) return;
    stack.push(config.id);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !stack.isTopmost(config.id)) return;
      event.preventDefault();
      dismiss();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      stack.pop(config.id);
      globalThis.removeEventListener('keydown', onKey);
    };
  });

  const dismiss = (): void => {
    store.dismiss(config.id);
    visible = false;
  };

  /**
   * Taking an action COMPLETES the tip rather than dismissing it. The two are
   * different facts — "they did the thing" and "they made it go away" — and
   * the store keeps them apart so a later "show me what I skipped" can tell.
   */
  const act = async (action: TipAction): Promise<void> => {
    await action.handler();
    store.complete(config.id);
    visible = false;
  };
</script>

{#if visible}
  <div class={['alert alert-info alert-soft items-start', className]} role="status" aria-live="polite">
    <div class="flex-1 space-y-2">
      <p class="font-semibold">{config.title}</p>
      {#if config.message !== undefined && config.message !== ''}
        <p class="text-sm">{config.message}</p>
      {/if}
      {#if config.actions !== undefined && config.actions.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each config.actions as action (action.id)}
            <button type="button" class="btn btn-sm" onclick={() => act(action)}>
              {action.title}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    <button
      type="button"
      class="btn btn-ghost btn-sm btn-circle"
      onclick={dismiss}
      aria-label={dismissLabel}
    >
      ✕
    </button>
  </div>
{/if}

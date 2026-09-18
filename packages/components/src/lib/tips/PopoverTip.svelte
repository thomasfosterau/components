<!--
  PopoverTip — a `Tip` anchored to the thing it is talking about: the
  caller's own trigger renders inside, and the bubble floats beside it.

  Built on bits-ui's `Popover` rather than the hand-measured `position: fixed`
  span the old copy used (a layout read per scroll frame, page-wide, for a
  bubble that never moves relative to what it points at) — bits-ui's
  `Popover.Content` computes and keeps that position via Floating UI, and
  handles focus containment and outside-click dismissal for free.

  `open` is NOT bound: it is a pure function of the tip's own state
  (`available` and not yet dismissed/completed), read back from the store. A
  tip shows because the store's rules say it may, never because the reader
  clicked the trigger — so the trigger element has its bits-ui click/keydown
  toggle handlers stripped (the `onclick`/`onkeydown` overrides below); it
  keeps only the id/ref wiring `Popover.Content` needs to float against it.
  Otherwise a click on an ordinary anchor button could pop open an EMPTY
  bubble for a tip the store has not decided to show yet (`Tip`'s own
  `{#if visible}` gate would render nothing inside).

  Escape closing is arbitrated by the shared `TipStack`, not by bits-ui's own
  (unrelated) escape-layer stacking order: `onEscapeKeydown` blocks the
  default close unless this tip is the page's topmost, so two tips opened
  from two different `PopoverTip`s still resolve "which one does Escape
  close" the same way two `Tip`s do. Whatever closes the popover — Escape
  when topmost, or a click outside it — is treated as a dismissal and fed
  back into the store via `onOpenChange`, so the store and the floating
  layer never disagree about whether the tip is showing.

  `Popover.Content` is `forceMount`ed: it stays in the DOM whether or not
  `open` is true, with bits-ui only toggling its floating position/listeners.
  That is what lets `Tip` — mounted unconditionally inside it — run its own
  `shouldDisplay`/`markShown` effect and flip the store to `available` in the
  first place. Without `forceMount`, `Content` would itself wait for `open`
  before rendering `Tip` at all, and `open` here is derived FROM what `Tip`
  decides — a deadlock neither side could break.
-->
<script lang="ts">
  import { Popover } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import Tip from './Tip.svelte';
  import { soloTipStack, type TipStack } from './tip-stack.ts';
  import type { TipStore } from './tip-store.svelte.ts';
  import type { TipConfig, TipPlacement } from './types.ts';

  interface Props {
    config: TipConfig;
    store: TipStore;
    stack?: TipStack;
    /** Which side of the trigger the bubble sits on. */
    placement?: TipPlacement;
    /** The trigger — a button, a field, whatever the tip is about. */
    children: Snippet<[]>;
    /** Accessible name of the tip's dismiss button. */
    dismissLabel?: string;
    class?: string;
  }

  let {
    config,
    store,
    stack = soloTipStack,
    placement = 'top',
    children,
    dismissLabel = 'Dismiss',
    class: className,
  }: Props = $props();

  const placementSide: Record<TipPlacement, 'top' | 'right' | 'bottom' | 'left'> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  };

  /** True exactly when `Tip` would render itself, read back from the store. */
  const open = $derived(store.getState(config.id).status === 'available');

  const handleOpenChange = (next: boolean): void => {
    if (!next) store.dismiss(config.id);
  };

  const handleEscapeKeydown = (event: KeyboardEvent): void => {
    if (!stack.isTopmost(config.id)) event.preventDefault();
  };
</script>

<Popover.Root {open} onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <span {...props} onclick={undefined} onkeydown={undefined} class="contents">
        {@render children()}
      </span>
    {/snippet}
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      forceMount
      side={placementSide[placement]}
      sideOffset={8}
      onEscapeKeydown={handleEscapeKeydown}
      class={['z-50 w-64', className]}
    >
      <Tip {config} {store} {stack} {dismissLabel} />
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>

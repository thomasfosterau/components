<!-- @component
Supplementary text on hover and on keyboard focus, on bits-ui’s `Tooltip`.
-->
<!--
  Tooltip — supplementary text on hover and on keyboard focus, on bits-ui's
  `Tooltip`.

  Provider-free by design. bits-ui's `Tooltip.Root` requires a
  `Tooltip.Provider` ancestor (it reads the shared open-delay state from
  context and throws without it), which means every consuming app would have
  to remember to mount one in its root layout before a single tooltip works.
  This component mounts its own, so `<Tooltip text="…">{trigger}</Tooltip>` is
  the whole API. The cost is that the "skip the delay for the next tooltip"
  behaviour is per-tooltip rather than app-wide, which is a fair trade for a
  primitive that always works.

  ARIA contract: bits-ui wires `aria-describedby` from the trigger to the
  content — DESCRIBED, not labelled, because a tooltip supplements a name it
  must never be the only source of. An icon-only control still needs its own
  accessible name (`VisuallyHidden`, or `aria-label`); a tooltip is not it,
  since a tooltip is unreachable to touch users entirely.

  The trigger renders through bits-ui's `child` snippet, so the caller's own
  element keeps its semantics instead of being wrapped in another button.
-->
<script lang="ts">
  import { Tooltip } from 'bits-ui';
  import type { Snippet } from 'svelte';

  interface Props {
    /** The tooltip's text. Ignored when `content` is given. */
    text?: string | undefined;
    /** Richer tooltip content, in place of `text`. */
    content?: Snippet<[]> | undefined;
    /**
     * Preferred side of the trigger; flipped on collision.
     * @defaultValue `'top'`
     */
    side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
    /**
     * Distance in pixels from the trigger.
     * @defaultValue `6`
     */
    sideOffset?: number | undefined;
    /**
     * Milliseconds of hover before it opens.
     * @defaultValue `400`
     */
    openDelay?: number | undefined;
    /** Whether the tooltip is open. Bindable. */
    open?: boolean | undefined;
    /** Extra classes on the content bubble. */
    class?: string | undefined;
    /** The trigger — the caller's own element, spreading `props` onto it. */
    children: Snippet<[{ props: Record<string, unknown> }]>;
  }

  let {
    text,
    content,
    side = 'top',
    sideOffset = 6,
    openDelay = 400,
    open = $bindable(false),
    class: className,
    children,
  }: Props = $props();
</script>

<Tooltip.Provider delayDuration={openDelay}>
  <Tooltip.Root bind:open>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        {@render children({ props })}
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content
        {side}
        {sideOffset}
        class={[
          'bg-neutral text-neutral-content rounded-box z-50 max-w-xs px-3 py-1.5 text-sm shadow-md',
          className,
        ]}
      >
        {#if content}
          {@render content()}
        {:else if text !== undefined}
          {text}
        {/if}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>

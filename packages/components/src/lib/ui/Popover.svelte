<!-- @component
A small floating panel anchored to a trigger, on bits-ui’s `Popover`.
-->
<!--
  Popover — a small floating panel anchored to a trigger, on bits-ui's
  `Popover`.

  Unlike a tooltip, a popover holds INTERACTIVE content: it takes focus, it
  closes on Escape and on an outside click, and it returns focus to the
  trigger. All of that is bits-ui's — it is precisely the hand-rolled part
  that is always subtly wrong.

  ARIA contract: bits-ui gives the trigger `aria-haspopup="dialog"` and
  `aria-expanded` and wires `aria-controls` to the panel, but it leaves the
  panel's own role to the caller — so `role="dialog"` is set here, where the
  focus trap and the Escape handler that make the role true already are. When
  `title` is set the panel is `aria-labelledby` that heading, so it announces
  what it is on open; without a title, label it from the call site. The close button is
  a labelled control, not a bare glyph.

  Both snippets take the caller's own element: `trigger` receives the props
  to spread, so an existing `Button` keeps its own markup.
-->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { Popover } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props {
    /** Whether the panel is open. Bindable. */
    open?: boolean | undefined;
    /**
     * Which side of the trigger the panel opens on.
     * @defaultValue `'bottom'`
     */
    side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
    /**
     * Alignment against the trigger along that side.
     * @defaultValue `'center'`
     */
    align?: 'start' | 'center' | 'end' | undefined;
    /**
     * Distance in pixels from the trigger.
     * @defaultValue `8`
     */
    sideOffset?: number | undefined;
    /** Heading for the panel; becomes its accessible name. */
    title?: string | undefined;
    /**
     * Accessible name of the close button. Omit to hide the button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /** Extra classes on the panel. */
    class?: string | undefined;
    /** The trigger — the caller's own element, spreading `props` onto it. */
    trigger: Snippet<[{ props: Record<string, unknown> }]>;
    /** The panel body, under `title` when one is given. */
    children: Snippet<[]>;
  }

  let {
    open = $bindable(false),
    side = 'bottom',
    align = 'center',
    sideOffset = 8,
    title,
    closeLabel = 'Close',
    class: className,
    trigger,
    children,
  }: Props = $props();

  const titleId = $props.id();
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      {@render trigger({ props })}
    {/snippet}
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      {side}
      {align}
      {sideOffset}
      role="dialog"
      aria-labelledby={title === undefined ? undefined : titleId}
      class={['card card-border bg-base-100 rounded-box z-50 w-72 p-4 shadow-md', className]}
    >
      {#if closeLabel !== undefined}
        <Popover.Close>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="sm" class="absolute top-2 right-2 btn-square">
              <X class="size-4" aria-hidden="true" />
              <VisuallyHidden>{closeLabel}</VisuallyHidden>
            </Button>
          {/snippet}
        </Popover.Close>
      {/if}
      {#if title !== undefined}
        <p id={titleId} class="mb-2 pr-8 font-semibold">{title}</p>
      {/if}
      {@render children()}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>

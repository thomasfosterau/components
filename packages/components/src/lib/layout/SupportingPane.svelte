<!-- @component
A main pane with a supporting panel (properties, comments, a legend): a column beside it on wide screens, a `Drawer` on narrow ones.
-->
<!--
  SupportingPane — SwiftUI's `.inspector`, Compose's `SupportingPaneScaffold`:
  the main content, and a secondary panel beside it from `expandAt` up. On
  narrower screens the same panel opens as a `Drawer` (bits-ui's dialog,
  with its focus trap, Escape and focus return) rather than squeezing the
  main pane. `open` drives both.

  Which presentation applies is read with `matchMedia` on the client. The
  server, and the first client render, draw the column (hidden by CSS below
  `expandAt`), so a wide page does not flash; the drawer exists only once the
  client knows the screen is narrow.

  ARIA contract:
  - Wide: the panel is an `<aside>` — a `complementary` landmark — named by
    its heading (`title`). The built-in toggle (rendered when `toggleLabel`
    is given) is a button with `aria-expanded` and, while the column is
    shown, `aria-controls`; closing the column leaves focus on it.
  - Narrow: `Drawer`'s modal-dialog contract, named by `title`; Escape closes
    it and focus returns to the toggle.

  The `sheet` presentation (#190 `BottomSheet`) and a draggable divider (#176
  `Splitter`) are follow-ups for when those primitives exist.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Drawer from '../feedback/Drawer.svelte';
  import Button from '../ui/Button.svelte';
  import { expandQuery, type ExpandAt } from './types.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The main pane. */
    children: Snippet<[]>;
    /** The supporting panel's content. */
    supporting: Snippet<[]>;
    /** The supporting panel's heading, and its accessible name ("Properties"). */
    title: string;
    /**
     * Whether the supporting panel is shown. Bindable.
     * @defaultValue `true`
     */
    open?: boolean | undefined;
    /**
     * The side the panel sits on, and the drawer enters from.
     * @defaultValue `'end'`
     */
    side?: 'start' | 'end' | undefined;
    /**
     * The width class from which the panel is a column.
     * @defaultValue `'lg'`
     */
    expandAt?: ExpandAt | undefined;
    /** Text of the built-in toggle; omit to render none and drive `open` yourself. */
    toggleLabel?: string | undefined;
    /**
     * Accessible name of the drawer's close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
  }

  let {
    children,
    supporting,
    title,
    open = $bindable(true),
    side = 'end',
    expandAt = 'lg',
    toggleLabel,
    closeLabel = 'Close',
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const panelId = `${uid}-panel`;
  const titleId = `${uid}-title`;

  /** Wide until the client says otherwise, so the server's column is the first paint. */
  let wide = $state(true);

  $effect(() => {
    if (typeof globalThis.matchMedia !== 'function') return;
    const query = globalThis.matchMedia(expandQuery[expandAt]);
    wide = query.matches;
    const update = (): void => {
      wide = query.matches;
    };
    query.addEventListener('change', update);
    return () => {
      query.removeEventListener('change', update);
    };
  });

  const columnClass: Record<ExpandAt, string> = {
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
  };
  const rowClass: Record<ExpandAt, string> = {
    md: 'md:flex-row',
    lg: 'lg:flex-row',
    xl: 'xl:flex-row',
  };
</script>

<div {...rest} class={['flex min-h-0 flex-col gap-4', rowClass[expandAt], className]}>
  <div class={['min-w-0 flex-1', side === 'start' && 'order-2']}>
    {#if toggleLabel !== undefined}
      <div class="mb-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-controls={wide && open ? panelId : undefined}
          onclick={() => {
            open = !open;
          }}
        >
          {toggleLabel}
        </Button>
      </div>
    {/if}
    {@render children()}
  </div>
  {#if wide}
    {#if open}
      <aside
        id={panelId}
        aria-labelledby={titleId}
        class={[
          'border-base-300 w-80 shrink-0 overflow-y-auto',
          side === 'start' ? 'order-1 border-e pe-4' : 'border-s ps-4',
          columnClass[expandAt],
        ]}
      >
        <h2 id={titleId} class="mb-2 text-lg font-semibold">{title}</h2>
        {@render supporting()}
      </aside>
    {/if}
  {:else}
    <Drawer bind:open {title} {closeLabel} {side}>
      {@render supporting()}
    </Drawer>
  {/if}
</div>

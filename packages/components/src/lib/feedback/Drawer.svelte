<!-- @component
A modal panel that slides in from an edge: a filters sheet, a mobile action sheet, mobile navigation.
-->
<!--
  Drawer — `Dialog`'s contract at an edge of the screen. It shares
  `DialogFrame` with `Dialog`, so the focus trap and return, Escape and
  overlay dismissal, scroll lock, `aria-modal`, the title as the accessible
  name and the labelled close button are one implementation.

  Not daisyUI's `drawer`: that is driven by a hidden checkbox and a
  `<label>` overlay, which gives no focus trap, no focus move or return, no
  Escape, no `aria-modal` and no name, and leaves the page behind it in the
  Tab order. Only daisyUI's look is borrowed here.

  The panel is a column: the title row, a body that scrolls on its own, and
  an `actions({ close })` footer that stays put. `start` / `end` follow
  the writing direction, so a `start` drawer opens from the right in RTL.
  It does not animate, so there is no motion to reduce; swipe-to-dismiss is
  out of v1.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import DialogFrame from './DialogFrame.svelte';
  import { drawerHeight, drawerSide, drawerWidth, type DrawerSide, type DrawerSize } from './sizes.ts';

  interface Props {
    /** Whether the drawer is shown. Bindable. */
    open?: boolean | undefined;
    /** Heading — the panel's accessible name. */
    title: string;
    /** Supporting line under the heading — the accessible description. */
    description?: string | undefined;
    /**
     * The edge the panel enters from.
     * @defaultValue `'end'`
     */
    side?: DrawerSide | undefined;
    /**
     * Width at `start` / `end`, height at `top` / `bottom`.
     * @defaultValue `'md'`
     */
    size?: DrawerSize | undefined;
    /**
     * Accessible name of the corner close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /** Hide the title visually; it stays the accessible name (mobile navigation). */
    hideTitle?: boolean | undefined;
    /** Extra classes on the panel. */
    class?: string | undefined;
    /** The opening control — the caller's own element, spreading `props`. */
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
    /** A footer row that stays in view; receives `close`. */
    actions?: Snippet<[{ close: () => void }]> | undefined;
    /** The panel body; it scrolls when long. */
    children: Snippet<[]>;
  }

  let {
    open = $bindable(false),
    title,
    description,
    side = 'end',
    size = 'md',
    closeLabel = 'Close',
    hideTitle = false,
    class: className,
    trigger,
    actions,
    children,
  }: Props = $props();

  const horizontal = $derived(side === 'start' || side === 'end');
</script>

<DialogFrame
  bind:open
  {title}
  {description}
  {closeLabel}
  {hideTitle}
  {trigger}
  {actions}
  {children}
  layout="sheet"
  contentClass={[
    'bg-base-100 fixed z-50 flex flex-col shadow-xl outline-none',
    drawerSide[side],
    horizontal ? drawerWidth[size] : drawerHeight[size],
    className,
  ]}
/>

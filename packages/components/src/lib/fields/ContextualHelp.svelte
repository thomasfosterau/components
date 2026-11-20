<!-- @component
An ⓘ or ? button beside a label, table header or stat that opens an explanatory popover on click, never hover.
-->
<!--
  ContextualHelp — for an explanation too long or too interactive for a
  `Tooltip` and too occasional for an always-visible hint: a paragraph and
  perhaps a link.

  ARIA contract: the trigger is a `<button>` named `${triggerLabel}: ${title}`
  ("Information: Hardiness zone"), since the icon and its neighbour's text are
  not enough on their own, with bits-ui's `aria-expanded` and
  `aria-controls`. It opens on click, Enter or Space only (a hover-opened
  panel fails WCAG 1.4.13 and is unreachable on touch). The panel is
  `Popover`'s non-modal `dialog`, named by `title`: focus moves in, Escape
  closes it and returns focus to the trigger. It never describes the field
  it sits beside: its content is long, and would be read on every focus.
-->
<script module lang="ts">
  /** Where the panel opens against the trigger. */
  export type ContextualHelpPlacement =
    | 'top'
    | 'top-start'
    | 'bottom'
    | 'bottom-start'
    | 'left'
    | 'right';

  type Side = 'top' | 'right' | 'bottom' | 'left';

  const placements: Record<ContextualHelpPlacement, { side: Side; align: 'start' | 'center' }> = {
    top: { side: 'top', align: 'center' },
    'top-start': { side: 'top', align: 'start' },
    bottom: { side: 'bottom', align: 'center' },
    'bottom-start': { side: 'bottom', align: 'start' },
    left: { side: 'left', align: 'center' },
    right: { side: 'right', align: 'center' },
  };
</script>

<script lang="ts">
  import { CircleQuestionMark, Info } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import Link from '../ui/Link.svelte';
  import Popover from '../ui/Popover.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'> {
    /** The panel's heading and accessible name, and the end of the trigger's name. */
    title: string;
    /** The explanation. */
    children: Snippet<[]>;
    /**
     * `'info'` (ⓘ) explains a term or a number; `'help'` (?) explains how to do something.
     * @defaultValue `'info'`
     */
    variant?: 'info' | 'help' | undefined;
    /**
     * The start of the trigger's name, before `: ${title}`.
     * @defaultValue `'Information'`, or `'Help'` for the `help` variant
     */
    triggerLabel?: string | undefined;
    /** A link under the explanation, to the full docs. */
    learnMore?: { readonly href: string; readonly label: string } | undefined;
    /**
     * Where the panel opens.
     * @defaultValue `'bottom-start'`
     */
    placement?: ContextualHelpPlacement | undefined;
    /** Whether the panel is open. Bindable. */
    open?: boolean | undefined;
    /**
     * The panel's close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
  }

  let {
    title,
    children,
    variant = 'info',
    triggerLabel,
    learnMore,
    placement = 'bottom-start',
    open = $bindable(false),
    closeLabel = 'Close',
    class: className,
    ...rest
  }: Props = $props();

  const name = $derived(
    `${triggerLabel ?? (variant === 'help' ? 'Help' : 'Information')}: ${title}`,
  );
  const anchor = $derived(placements[placement]);
</script>

<span {...rest} class={['inline-flex align-middle', className]}>
  <Popover bind:open {title} {closeLabel} side={anchor.side} align={anchor.align}>
    {#snippet trigger({ props })}
      <IconButtonCore {...props} label={name} size="xs" shape="circle">
        {#snippet icon()}
          {#if variant === 'help'}
            <CircleQuestionMark class="size-4" />
          {:else}
            <Info class="size-4" />
          {/if}
        {/snippet}
      </IconButtonCore>
    {/snippet}
    <div class="text-sm">{@render children()}</div>
    {#if learnMore !== undefined}
      <Link href={learnMore.href} class="mt-3 inline-block text-sm">{learnMore.label}</Link>
    {/if}
  </Popover>
</span>

<!-- @component
The screen's one primary action as a floating button, optionally extended with its label, which can collapse while the page scrolls down.
-->
<!--
  ARIA contract: a native `<button>` or `<a>` whose name is always `label`.
  Collapsed, the label stays in a visually hidden span rather than leaving.
  No bits-ui: a single FAB must stay light. Give the page's last row room
  (`pb-24`) so the fixed button never covers it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { fabPosition, fabSize, type FabPosition, type FabSize } from './fab.ts';
  import { buttonTone, type Tone } from './tones.ts';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props extends Omit<HTMLButtonAttributes, 'type' | 'children'> {
    /** The accessible name; also the visible text when extended. */
    label: string;
    /** The icon; decorative. */
    icon: Snippet<[]>;
    /**
     * Show the label beside the icon.
     * @defaultValue `false`
     */
    extended?: boolean | undefined;
    /**
     * Collapse an extended button to its icon while the reader scrolls down, and re-extend on scroll up.
     * @defaultValue `false`
     */
    collapseOnScroll?: boolean | undefined;
    /** The element whose scrolling `collapseOnScroll` follows; the window when omitted. */
    scrollContainer?: HTMLElement | undefined;
    /** Render a link instead, resolved through the components context. */
    href?: string | undefined;
    /**
     * Size step.
     * @defaultValue `'md'`
     */
    size?: FabSize | undefined;
    /**
     * Semantic colour.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * Where it sits; `'inline'` keeps it in the flow.
     * @defaultValue `'end'`
     */
    position?: FabPosition | undefined;
  }

  let {
    label,
    icon,
    extended = false,
    collapseOnScroll = false,
    scrollContainer,
    href,
    size = 'md',
    tone = 'primary',
    position = 'end',
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  // A link FAB takes the same attributes; `<a>` is typed apart from `<button>`.
  const linkAttributes = $derived(rest as HTMLAnchorAttributes);
  let collapsed = $state(false);
  const showLabel = $derived(extended && !collapsed);

  /** Movement, in pixels, that counts as a scroll direction. */
  const SCROLL_SLOP = 8;

  $effect(() => {
    if (!extended || !collapseOnScroll) return;
    const target: HTMLElement | Window = scrollContainer ?? window;
    const offset = (): number => (scrollContainer === undefined ? window.scrollY : scrollContainer.scrollTop);
    let last = offset();
    const onscroll = (): void => {
      const now = offset();
      if (Math.abs(now - last) < SCROLL_SLOP) return;
      collapsed = now > last;
      last = now;
    };
    target.addEventListener('scroll', onscroll, { passive: true });
    return () => target.removeEventListener('scroll', onscroll);
  });

  const classes = $derived([
    'btn shadow-lg motion-safe:transition-all',
    showLabel ? 'rounded-full' : 'btn-circle',
    buttonTone[tone],
    fabSize[size],
    fabPosition[position],
    className,
  ]);
</script>

{#snippet body()}
  <span class="inline-flex" aria-hidden="true">{@render icon()}</span>
  {#if showLabel}<span>{label}</span>{:else}<VisuallyHidden>{label}</VisuallyHidden>{/if}
{/snippet}

{#if href !== undefined}
  <a {...linkAttributes} href={context.href(href)} class={classes} data-fab>{@render body()}</a>
{:else}
  <button {...rest} type="button" class={classes} data-fab>{@render body()}</button>
{/if}

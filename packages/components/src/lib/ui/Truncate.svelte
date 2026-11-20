<!-- @component
One line of text that may not fit, cut at the end, start or middle ("IMG_2024…_0412.jpg"), with the full text kept for screen readers, copying and a tooltip when it is cut.
-->
<!--
  The end cut is CSS. The middle and start cuts are measured, so the visible
  string is `aria-hidden` beside the full text, visually hidden; before
  scripts run they fall back to the end cut. The tooltip opens on hover, or
  on focus of an enclosing link or button, only while the text is cut.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Tooltip from './Tooltip.svelte';
  import VisuallyHidden from './VisuallyHidden.svelte';
  import { canvasMeasure, defaultKeepEnd, truncateText, type TruncatePosition } from './truncate.ts';

  type TruncateWidth = 'xs' | 'sm' | 'md' | 'lg' | 'full';

  const maxWidthClass: Record<TruncateWidth, string> = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full',
  };

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** The full text. */
    text: string;
    /**
     * Where to cut it.
     * @defaultValue `'end'`
     */
    position?: TruncatePosition | undefined;
    /** Middle cut: characters always kept at the end; by default the last path segment or the extension. */
    keepEnd?: number | undefined;
    /**
     * Show the full text in a tooltip while it is cut.
     * @defaultValue `true`
     */
    tooltip?: boolean | undefined;
    /** A maximum width; otherwise the container's. */
    maxWidth?: TruncateWidth | undefined;
    /**
     * Monospaced, for paths and branch names.
     * @defaultValue `false`
     */
    mono?: boolean | undefined;
  }

  let {
    text,
    position = 'end',
    keepEnd,
    tooltip = true,
    maxWidth,
    mono = false,
    class: className,
    ...rest
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let shown = $state(text);
  let cut = $state(false);
  let open = $state(false);

  const measured = $derived(position !== 'end');

  const onfocusin = (): void => {
    open = cut;
  };
  const onfocusout = (): void => {
    open = false;
  };

  /** Fit the text to the element's width now, and again on every resize. */
  const fit = (node: HTMLElement) => {
    const update = (): void => {
      if (position === 'end') {
        shown = text;
        cut = node.scrollWidth > node.clientWidth;
        return;
      }
      const measure = canvasMeasure(node);
      const fitted = truncateText(text, node.clientWidth, measure, position, keepEnd ?? defaultKeepEnd(text));
      shown = fitted;
      cut = fitted !== text;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    // Keyboard users reach the full text through the link or button around it.
    const host = node.parentElement?.closest('a[href], button, [tabindex]');
    host?.addEventListener('focusin', onfocusin);
    host?.addEventListener('focusout', onfocusout);
    return () => {
      observer.disconnect();
      host?.removeEventListener('focusin', onfocusin);
      host?.removeEventListener('focusout', onfocusout);
    };
  };

  /** Copying the cut string copies the full text. */
  const oncopy = (event: ClipboardEvent): void => {
    if (!cut || event.clipboardData === null) return;
    event.clipboardData.setData('text/plain', text);
    event.preventDefault();
  };

  /** The trigger's props, less what would make this a tab stop or describe it twice. */
  const triggerProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const { tabindex: _tabindex, 'aria-describedby': _describedBy, ...kept } = props;
    return kept;
  };
</script>

{#snippet body(props: Record<string, unknown>)}
  <!-- Layout is inline: the measurement depends on it, so it holds without the stylesheet. -->
  <span
    {...props}
    {...rest}
    class={[maxWidth && maxWidthClass[maxWidth], mono && 'font-mono', className]}
    style:display="block"
    style:overflow="hidden"
    style:white-space="nowrap"
    style:text-overflow="ellipsis"
    {oncopy}
    {@attach fit}
  >
    {#if measured}
      <span aria-hidden="true">{shown}</span><VisuallyHidden>{text}</VisuallyHidden>
    {:else}
      {text}
    {/if}
  </span>
{/snippet}

{#if tooltip}
  <Tooltip {text} bind:open={() => open, (value) => (open = value && cut)}>
    {#snippet children({ props })}
      {@render body(triggerProps(props))}
    {/snippet}
  </Tooltip>
{:else}
  {@render body({})}
{/if}

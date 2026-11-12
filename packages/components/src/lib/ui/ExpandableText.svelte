<!-- @component
Long text clamped to a few lines with a "Show more" / "Show less" toggle that appears only when the text actually overflows; the full text stays readable by assistive technology.
-->
<!--
  ExpandableText — a plant description, a review, an abstract: the first
  `lines` lines and a toggle for the rest.

  ARIA contract — the reason this exists rather than a hand-rolled
  `line-clamp`: the container ALWAYS holds the full text. Clamping is visual
  only (`line-clamp`, i.e. `overflow: hidden`), so a screen reader reads all
  of it in either state; nothing is truncated in the DOM, and nothing is
  `aria-hidden`. The toggle is therefore a visual affordance, but still a real
  `<button aria-expanded aria-controls>` for keyboard and voice users, named
  by `moreLabel` / `lessLabel` — the one case where a name legitimately
  changes with state, because the visible text does. Collapsing keeps focus
  on the toggle and scrolls it into view.

  The toggle is rendered only when the text overflows `lines` at the current
  width: a `ResizeObserver` (inside an `$effect`) compares the content's
  `scrollHeight` with `lines` × its computed line height, which holds in
  either state, so a resize that makes the text fit removes the toggle even
  while expanded. Not a `Disclosure`: a closed `<details>` hides its content
  from everyone, which is the wrong shape for prose whose first lines are
  the useful part. No height animation, so reduced motion needs no case.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { lineClamp, type ClampLines } from './tones.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The text. */
    children: Snippet<[]>;
    /**
     * Lines shown while collapsed.
     * @defaultValue `3`
     */
    lines?: ClampLines | undefined;
    /**
     * Whether the full text shows. Bindable.
     * @defaultValue `false`
     */
    expanded?: boolean | undefined;
    /**
     * The toggle's text while collapsed.
     * @defaultValue `'Show more'`
     */
    moreLabel?: string | undefined;
    /**
     * The toggle's text while expanded.
     * @defaultValue `'Show less'`
     */
    lessLabel?: string | undefined;
    /**
     * Hide the toggle once expanded (a one-way reveal).
     * @defaultValue `false`
     */
    oneWay?: boolean | undefined;
    /**
     * Fade out the last visible line instead of an ellipsis.
     * @defaultValue `false`
     */
    fade?: boolean | undefined;
  }

  let {
    children,
    lines = 3,
    expanded = $bindable(false),
    moreLabel = 'Show more',
    lessLabel = 'Show less',
    oneWay = false,
    fade = false,
    id: idProp,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const textId = $derived(`${idProp ?? uid}-text`);

  let text: HTMLDivElement | undefined = $state();
  let toggle: HTMLButtonElement | undefined = $state();
  let overflows = $state(false);

  $effect(() => {
    const element = text;
    const count = lines;
    if (element === undefined) return;
    const measure = (): void => {
      const style = getComputedStyle(element);
      const parsed = Number.parseFloat(style.lineHeight);
      const line = Number.isFinite(parsed) ? parsed : Number.parseFloat(style.fontSize) * 1.2;
      overflows = element.scrollHeight > line * count + 1;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  });

  const flip = (): void => {
    expanded = !expanded;
    if (!expanded) toggle?.scrollIntoView({ block: 'nearest' });
  };
</script>

<div {...rest} id={idProp} class={['flex flex-col items-start gap-1', className]}>
  <div
    bind:this={text}
    id={textId}
    class={[
      !expanded && !fade && lineClamp[lines],
      !expanded && fade && 'overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]',
    ]}
    style:max-height={!expanded && fade ? `${lines}lh` : undefined}
  >
    {@render children()}
  </div>
  {#if overflows && !(oneWay && expanded)}
    <button
      bind:this={toggle}
      type="button"
      class="btn btn-link btn-sm px-0"
      aria-expanded={expanded}
      aria-controls={textId}
      onclick={flip}
    >
      {expanded ? lessLabel : moreLabel}
    </button>
  {/if}
</div>

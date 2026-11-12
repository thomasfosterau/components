<!-- @component
A "Back to top" link that appears once the reader has scrolled a long way down, returning them, and the focus, to the top.
-->
<!--
  BackToTop — the quick way back up a long account, guide or feed. Two
  forms: `inline` (the default, GOV.UK's "Back to top": a sticky link at the
  end of the content column, which covers nothing) and `floating` (a fixed
  button at the bottom end corner).

  ARIA and keyboard contract: a real `<a href="#main-content">` with a
  visible text label (the arrow icon is decorative), so with no script it is
  an ordinary fragment link. With script, activating it scrolls the window
  (or `scrollContainer`) to the top — smoothly, or instantly under
  `prefers-reduced-motion` — and moves focus to the target the way
  `SkipLink` does (`focus-target.ts`: `tabindex="-1"` for that one visit), so
  the next Tab continues from the top rather than from the bottom of the
  page. While the reader is above `threshold` the link is `hidden`: out of
  the accessibility tree and the tab order, not merely transparent. Its
  appearance is never announced — it is an affordance, not news — so there
  is no live region.

  Visibility uses an `IntersectionObserver` on a `threshold`-tall sentinel
  at the top of the scroll root, never a `scroll` listener: the link shows
  once the sentinel has scrolled out of view. For the window the sentinel is
  an absolutely positioned box at the top of the document; for a
  `scrollContainer` it is prepended to the container with a negative bottom
  margin, so it takes no space in either.

  A `floating` link sits `--back-to-top-offset` (default `0px`) above the
  bottom safe-area inset plus `1rem`; set the variable on an ancestor to
  stack it above a floating action button.
-->
<script lang="ts">
  import { ArrowUp } from '@lucide/svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { focusTarget } from './focus-target.ts';

  /** Where a `BackToTop` link sits. */
  type BackToTopVariant = 'inline' | 'floating';

  interface Props extends Omit<HTMLAnchorAttributes, 'href' | 'children'> {
    /**
     * The id of the element to return focus to.
     * @defaultValue `'main-content'` (`Main`'s default id)
     */
    target?: string | undefined;
    /**
     * How far, in CSS pixels, the reader scrolls before the link appears.
     * @defaultValue `800`
     */
    threshold?: number | undefined;
    /**
     * `inline` — sticky at the end of the content column; `floating` — a fixed corner button.
     * @defaultValue `'inline'`
     */
    variant?: BackToTopVariant | undefined;
    /**
     * The link's visible text and accessible name.
     * @defaultValue `'Back to top'`
     */
    label?: string | undefined;
    /** Scroll this element, rather than the window, back to the top. */
    scrollContainer?: HTMLElement | undefined;
  }

  let {
    target = 'main-content',
    threshold = 800,
    variant = 'inline',
    label = 'Back to top',
    scrollContainer,
    class: className,
    onclick,
    ...rest
  }: Props = $props();

  const variantClasses: Record<BackToTopVariant, string> = {
    inline: 'link link-hover sticky bottom-4 inline-flex items-center gap-1',
    floating:
      'btn btn-neutral btn-sm fixed end-4 bottom-[calc(1rem+env(safe-area-inset-bottom)+var(--back-to-top-offset,0px))] z-40 shadow-lg',
  };

  // Shown until the observer reports, so the link also renders without
  // script (and in server-rendered HTML) as the plain fragment link it is.
  let visible = $state(true);

  /** A `threshold`-tall box at the top of `root` that takes no layout space. */
  const createSentinel = (root: HTMLElement | undefined, height: number): HTMLElement => {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.height = `${height}px`;
    sentinel.style.visibility = 'hidden';
    sentinel.style.pointerEvents = 'none';
    if (root === undefined) {
      sentinel.style.position = 'absolute';
      sentinel.style.top = '0';
      sentinel.style.left = '0';
      sentinel.style.width = '1px';
      document.body.append(sentinel);
    } else {
      sentinel.style.marginBottom = `-${height}px`;
      root.prepend(sentinel);
    }
    return sentinel;
  };

  $effect(() => {
    const sentinel = createSentinel(scrollContainer, threshold);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (entry !== undefined) visible = !entry.isIntersecting;
      },
      { root: scrollContainer ?? null },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  });

  const backToTop = (event: MouseEvent & { currentTarget: HTMLAnchorElement }): void => {
    onclick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (scrollContainer ?? window).scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    // `preventScroll`: the focus must not cut the smooth scroll short. With
    // no such target, drop focus so the next Tab starts from the top.
    if (!focusTarget(target, { preventScroll: true })) event.currentTarget.blur();
  };
</script>

<a
  {...rest}
  href="#{target}"
  hidden={!visible}
  class={[variantClasses[variant], className]}
  onclick={backToTop}
>
  <ArrowUp class="size-4" aria-hidden="true" />
  {label}
</a>

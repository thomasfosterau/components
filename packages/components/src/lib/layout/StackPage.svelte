<!-- @component
One screen of a `NavigationStack`: a title (the page's `h1`), a Back link naming the screen it returns to, and the content. On a push, focus moves to the title; on a pop, back to whatever the reader opened.
-->
<!--
  StackPage — the screen. The Back link is a real link, so it works without
  script and behaves like browser Back. After a push the `h1` takes focus (and
  is announced); after a pop, focus goes back to the element the reader left
  this page from, then to `restoreFocus`, then to the `h1`. Focus moves only
  once the navigation and its transition have finished, so it lands after the
  router's own focus reset. Outside a `NavigationStack` it is a plain screen.
-->
<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { focusElement } from './focus-target.ts';
  import { getNavigationStack, type NavigationStackState } from './stack-direction.svelte.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
    /** The screen's title: its `h1`, and what the next screen's Back link names. */
    title: string;
    /**
     * This screen's own app path, which a later screen's `backHref` points at.
     * @defaultValue the URL it was navigated to
     */
    href?: string | undefined;
    /** Where Back goes, as an app path; omit on the root screen. */
    backHref?: string | undefined;
    /**
     * The Back link's visible text.
     * @defaultValue the previous screen's title, or `'Back'`
     */
    backLabel?: string | undefined;
    /**
     * The Back link's accessible name, given the screen it returns to.
     * @defaultValue `` (title) => `Back to ${title}` ``, or `'Back'` when the title is unknown
     */
    backToLabel?: ((title: string) => string) | undefined;
    /**
     * Fallback for the text and name when the previous screen is unknown.
     * @defaultValue `'Back'`
     */
    backFallbackLabel?: string | undefined;
    /** Id of the element to focus when the reader comes back here, if the one they left from is gone. */
    restoreFocus?: string | undefined;
    /** The screen's content. */
    children: Snippet<[]>;
    /** Controls at the end of the title bar. */
    actions?: Snippet<[]> | undefined;
  }

  let {
    title,
    href,
    backHref,
    backLabel,
    backToLabel = (previous: string) => `Back to ${previous}`,
    backFallbackLabel = 'Back',
    restoreFocus,
    children,
    actions,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const headingId = `${uid}-title`;
  const context = getComponentsContext();
  const stack = getNavigationStack();

  let section: HTMLElement | undefined = $state();
  let heading: HTMLElement | undefined = $state();
  let backLink: HTMLAnchorElement | undefined = $state();

  const previous = $derived(backHref === undefined ? undefined : stack?.titleOf(backHref));
  const backText = $derived(backLabel ?? previous ?? backFallbackLabel);
  const backName = $derived(previous === undefined ? backText : backToLabel(previous));

  /** On a pop, the element the reader left from, then `restoreFocus`; otherwise the title. */
  const focusAfter = (path: string): HTMLElement | undefined => {
    if (stack?.direction !== 'pop') return heading;
    const selector = stack.focusOn(path);
    const left = selector === undefined ? null : section?.querySelector<HTMLElement>(selector);
    const fallback = restoreFocus === undefined ? null : document.getElementById(restoreFocus);
    return left ?? fallback ?? heading;
  };

  /** Once the navigation has settled, move focus for the way the reader arrived. */
  const arrive = async (
    on: NavigationStackState,
    path: string,
    mounted: () => boolean,
  ): Promise<void> => {
    await on.settled();
    const target = mounted() ? focusAfter(path) : undefined;
    if (target) focusElement(target);
  };

  onMount(() => {
    if (!stack) return;
    const entry = { title, href, backHref, backLink: () => backLink };
    const path = stack.enter(entry);
    let live = true;
    if (stack.direction !== undefined) void arrive(stack, path, () => live);
    return () => {
      live = false;
      stack.leave(entry);
    };
  });
</script>

<section
  {...rest}
  bind:this={section}
  aria-labelledby={headingId}
  class={['flex flex-col gap-4', className]}
  style:view-transition-name="stack-page"
>
  {#if backHref !== undefined}
    <header class="flex items-center gap-2">
      <a
        bind:this={backLink}
        href={context.href(backHref)}
        aria-label={backName}
        class="btn btn-ghost btn-sm -ms-2 gap-1 px-2"
      >
        <ChevronLeft class="size-4 rtl:rotate-180" aria-hidden="true" />{backText}
      </a>
    </header>
  {/if}
  <div class="flex items-center justify-between gap-2">
    <h1 bind:this={heading} id={headingId} tabindex="-1" class="text-2xl font-semibold focus:outline-none">
      {title}
    </h1>
    {#if actions}<div class="flex items-center gap-2">{@render actions()}</div>{/if}
  </div>
  {@render children()}
</section>

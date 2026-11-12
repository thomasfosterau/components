<!-- @component
"Skip to main content": the first focusable element on the page, hidden until focused, jumping to `Main` (or to several named targets).
-->
<!--
  SkipLink — lets a keyboard user bypass the navbar and sidebar on every
  page (WCAG 2.4.1 Bypass Blocks). Landmarks alone technically satisfy the
  criterion, but sighted keyboard users do not navigate by landmark. Place
  it FIRST in the root layout, before the `Navbar`, so it is the first Tab
  stop.

  ARIA and keyboard contract: a real `<a href="#main-content">` — it works
  with no script at all, and `Main` takes `id="main-content"` by default, so
  `<SkipLink />` needs no configuration. It is `sr-only` until focused (never
  `display: none`, which would take it out of the tab order), then shown at
  the top start of the viewport above sticky headers. On activation the
  target, when it is not focusable already, gets `tabindex="-1"` and is
  focused (the GOV.UK technique: some browsers scroll to a fragment without
  moving the sequential focus starting point), with its outline suppressed;
  both are removed again when it loses focus, so the next Tab continues from
  inside the target. `targets` renders several links in order ("Skip to
  search", "Skip to results") — no registration context, by design.
-->
<script module lang="ts">
  /** Make the target take focus, as the fragment navigation alone may not. */
  const focusTarget = (targetId: string): void => {
    const element = document.getElementById(targetId);
    if (element === null) return;
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
      element.style.outline = 'none';
      element.addEventListener(
        'blur',
        () => {
          element.removeAttribute('tabindex');
          element.style.removeProperty('outline');
        },
        { once: true },
      );
    }
    element.focus();
  };
</script>

<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  /** One skip destination: the target element's id and the link's text. */
  interface SkipTarget {
    readonly id: string;
    readonly label: string;
  }

  interface Props extends Omit<HTMLAnchorAttributes, 'href' | 'children'> {
    /**
     * The target element's id.
     * @defaultValue `'main-content'` (`Main`'s default id)
     */
    target?: string | undefined;
    /**
     * The link's text.
     * @defaultValue `'Skip to main content'`
     */
    label?: string | undefined;
    /** Several skip destinations, in order, instead of `target` / `label`. An `id` goes on the first link. */
    targets?: readonly SkipTarget[] | undefined;
  }

  let {
    target = 'main-content',
    label = 'Skip to main content',
    targets,
    id,
    class: className,
    onclick,
    ...rest
  }: Props = $props();

  const links = $derived(targets ?? [{ id: target, label }]);
</script>

{#each links as link, index (link.id)}
  <a
    {...rest}
    id={index === 0 ? id : undefined}
    href="#{link.id}"
    class={[
      'btn btn-primary btn-sm sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50',
      className,
    ]}
    onclick={(event) => {
      onclick?.(event);
      if (!event.defaultPrevented) focusTarget(link.id);
    }}
  >
    {link.label}
  </a>
{/each}

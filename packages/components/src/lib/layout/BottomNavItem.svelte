<!-- @component
One destination of a `BottomNav`: a link with an icon over its label, marked current from the components context.
-->
<!--
  BottomNavItem — a link resolved through the components context's
  `href()`, current when the context's `isCurrent()` says so (or `current`
  overrides it), the same rule `MenuItem` follows.

  ARIA contract: the link's name is its `label`, plus the badge's text
  (`badgeLabel`, "3 new") in `VisuallyHidden` — never the icon, whose
  wrapper is `aria-hidden`. The current item is `aria-current="page"` and
  `dock-active`, and shows `currentIcon` when given, so selection is not
  colour alone; never `aria-selected` — these are links, not tabs.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';

  interface Props extends Omit<HTMLAnchorAttributes, 'href' | 'children'> {
    /** App-relative path, resolved through the context's `href()`. */
    href: string;
    /** The visible label under the icon, and the accessible name. */
    label: string;
    /** Overrides the context's `isCurrent(href)`. */
    current?: boolean | undefined;
    /** A count or marker beside the icon (unread notifications), drawn as a `badge`. */
    badge?: string | number | undefined;
    /**
     * The badge's text for assistive technology, after the label.
     * @defaultValue `"<badge> new"`
     */
    badgeLabel?: ((badge: string | number) => string) | undefined;
    /** The icon. Decorative: its wrapper is `aria-hidden`. */
    icon: Snippet<[]>;
    /** The icon while this item is current (a filled variant). Omitted, `icon`. */
    currentIcon?: Snippet<[]> | undefined;
  }

  let {
    href,
    label,
    current,
    badge,
    badgeLabel = (value) => `${value} new`,
    icon,
    currentIcon,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const resolved = $derived(context.href(href));
  const isCurrent = $derived(current ?? context.isCurrent(resolved));
</script>

<li>
  <a
    {...rest}
    href={resolved}
    aria-current={isCurrent ? 'page' : undefined}
    class={[
      'flex size-full flex-col items-center justify-center gap-px',
      isCurrent && 'dock-active',
      className,
    ]}
  >
    <span aria-hidden="true" class="relative inline-flex size-5">
      {@render (isCurrent ? (currentIcon ?? icon) : icon)()}
      {#if badge !== undefined}
        <span class="badge badge-primary badge-xs absolute -end-2 -top-1">{badge}</span>
      {/if}
    </span>
    <span class="dock-label">{label}</span>
    {#if badge !== undefined}<VisuallyHidden>{badgeLabel(badge)}</VisuallyHidden>{/if}
  </a>
</li>

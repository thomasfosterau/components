<!--
  FilterBar — the row of filter options above a list, as links rather than a
  form.

  Links, deliberately: a filtered view is then a URL an operator can bookmark,
  paste into a message, or reload — which a `<select>` that mutates client
  state is not. `href` is supplied per option by the page, because a cursor,
  a sort order and a search term all have to travel with the filter and only
  the page knows what the rest of its query string is.

  `active` is the caller's to decide for the same reason: only the page knows
  which axis this row filters on.

  ARIA contract: a `<nav aria-label>` — each surface filters on a different
  axis ("Filter by status", "Filter by licence") and an unnamed second
  navigation landmark on a page is one a reader cannot tell from the first.
  The active option carries `aria-current="page"` as well as daisyUI's
  `btn-active`, because the highlight is a colour and the attribute is what
  says so out loud. The options are anchors, not buttons, so the `btn` class
  here is a costume, not a role.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import type { FilterOption } from './types.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    options: readonly FilterOption[];
    /** Accessible name for the row — say which axis it filters on. */
    label: string;
  }

  let { options, label, class: className, ...rest }: Props = $props();

  const context = getComponentsContext();
</script>

<nav {...rest} aria-label={label} class={['flex flex-wrap items-center gap-2', className]}>
  {#each options as option (option.key)}
    <a
      href={context.href(option.href)}
      class={['btn btn-sm', option.active && 'btn-active']}
      aria-current={option.active ? 'page' : undefined}
    >
      {option.label}
    </a>
  {/each}
</nav>

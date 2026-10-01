<!-- @component
The quiet card an index or result list shows instead of a bare empty list: a heading, optional copy, icon and call to action.
-->
<!--
  EmptyState — the quiet card an index or a result list shows instead of a
  bare empty `<ul>`: a heading, optional supporting copy, an optional icon
  above and an optional call to action below.

  Content-first, not a hero. "Nothing here" is a normal state of a healthy
  page, and the surface it is drawn on is the same `Card` every other block
  on the page uses, so an empty list does not look like a failure.

  ARIA contract: `title` is a real heading at `headingLevel` (`h2` by
  default), so a reader navigating by headings finds out the section is empty
  instead of finding nothing at all. The icon is decorative and hidden.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Card from './Card.svelte';
  import type { HeadingLevel } from './tones.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Short, direct heading for the empty surface ("No results yet"). */
    title: string;
    /** Supporting copy explaining the state or the next step. */
    description?: string | undefined;
    /**
     * The heading level, so the page outline stays intact.
     * @defaultValue `2`
     */
    headingLevel?: HeadingLevel | undefined;
    /** Decorative icon rendered above the heading. */
    icon?: Snippet<[]> | undefined;
    /** Call to action — a button or a link — rendered under the copy. */
    action?: Snippet<[]> | undefined;
  }

  let {
    title,
    description,
    headingLevel = 2,
    icon,
    action,
    class: className,
    ...rest
  }: Props = $props();
</script>

<Card
  {...rest}
  as="div"
  class={className}
  bodyClass="items-center gap-2 p-8 text-center sm:p-10"
>
  {#if icon}
    <div class="text-base-content/50 mb-2" aria-hidden="true">{@render icon()}</div>
  {/if}
  <svelte:element this={`h${headingLevel}`} class="text-2xl font-semibold">{title}</svelte:element>
  {#if description !== undefined}
    <p class="text-base-content/70 max-w-prose leading-7">{description}</p>
  {/if}
  {#if action}
    <div class="mt-2">{@render action()}</div>
  {/if}
</Card>

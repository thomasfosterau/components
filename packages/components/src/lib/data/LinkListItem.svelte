<!--
  LinkListItem — the row body most lists want: a linked title, a line of
  context under it, and short markers.

  It renders the body only, never the `<li>` or the `<article>` around it,
  because the container is `ItemList`'s decision (a list item in one mode, a
  feed article in the other) and a component that rendered both would have to
  know which.

  ARIA contract: the title is a real link, resolved through the components
  context, and it is the row's only interactive element — the subtitle and
  the badges are text beside it, not a second target. `headingLevel` promotes
  the title to a real heading for a list of sections a reader navigates by
  headings; by default it is not one, because twenty `<h3>`s in a filter
  result is worse for navigation than none.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Badge from '../ui/Badge.svelte';
  import Link from '../ui/Link.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
    /** Where the title links to; resolved through the components context. */
    href: string;
    title: string;
    /** A line of context under the title — an owner, a parent, a date. */
    subtitle?: string | undefined;
    /** Short markers rendered as badges. */
    badges?: readonly string[] | undefined;
    /** Render the title as a real heading at this level. */
    headingLevel?: HeadingLevel | undefined;
    /** Extra detail under the subtitle — formatted dates, counts, a second link. */
    meta?: Snippet<[]> | undefined;
  }

  let {
    href,
    title,
    subtitle,
    badges,
    headingLevel,
    meta,
    class: className,
    ...rest
  }: Props = $props();
</script>

<div {...rest} class={['flex flex-col gap-1', className]}>
  {#if headingLevel === undefined}
    <Link {href} variant="muted" class="font-medium">{title}</Link>
  {:else}
    <svelte:element this={`h${headingLevel}`} class="text-base font-medium">
      <Link {href} variant="muted">{title}</Link>
    </svelte:element>
  {/if}
  {#if subtitle !== undefined}
    <p class="text-base-content/70 text-sm">{subtitle}</p>
  {/if}
  {#if meta}
    <div class="text-base-content/60 text-sm">{@render meta()}</div>
  {/if}
  {#if badges !== undefined && badges.length > 0}
    <div class="flex flex-wrap gap-1">
      {#each badges as badge (badge)}
        <Badge variant="outline" size="sm">{badge}</Badge>
      {/each}
    </div>
  {/if}
</div>

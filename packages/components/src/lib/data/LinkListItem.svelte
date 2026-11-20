<!-- @component
The row body most lists want: a linked title, a line of context under it, and short badges.
-->
<!--
  LinkListItem — the row body most lists want: a linked title, a line of
  context under it, and short markers. Built on `ListRow`.

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
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import Badge from '../ui/Badge.svelte';
  import Link from '../ui/Link.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';
  import ListRow from './ListRow.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
    /** Where the title links to; resolved through the components context. */
    href: string;
    /** The linked title; rendered as a heading when `headingLevel` is set. */
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

  let { href, title, subtitle, badges, headingLevel, meta, onclick, ...rest }: Props = $props();

  /**
   * A caller's `onclick` stays a plain listener on the row body. Passed as
   * `ListRow`'s `onclick` it would turn the body into a button around the link.
   */
  // The row body is the `<div>` these attributes were typed for; `ListRow`
  // types its body as any element because a link or button row is not one.
  const rowAttributes = $derived(rest as Omit<HTMLAttributes<HTMLElement>, 'onclick'>);

  const listen: Attachment<HTMLElement> = (node) => {
    if (onclick == null) return;
    const handler = onclick as unknown as (event: MouseEvent) => void;
    node.addEventListener('click', handler);
    return () => node.removeEventListener('click', handler);
  };
</script>

<ListRow {...rowAttributes} supporting={subtitle} {@attach listen}>
  {#snippet headline()}
    {#if headingLevel === undefined}
      <Link {href} variant="muted">{title}</Link>
    {:else}
      <svelte:element this={`h${headingLevel}`} class="text-base">
        <Link {href} variant="muted">{title}</Link>
      </svelte:element>
    {/if}
  {/snippet}
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
</ListRow>

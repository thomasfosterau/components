<!-- @component
The summary rail beside an entity page’s prose: an optional header and image above a body of labelled facts.
-->
<!--
  Infobox — the summary rail beside an entity page's prose: an optional
  header, an optional image, and a body of labelled facts.

  Two ways to fill it, both live at once. The composable path — `children`
  taking `InfoboxSection`/`InfoboxRow` (or anything else):
  a page builds bespoke markup, one piece of markup per concern, and a fix
  to row layout lands once because there is only one row layout. `rows` renders through the SAME `InfoboxSection`/
  `InfoboxRow`/`InfoboxImage` primitives `children` would use — never a
  second copy of the markup — so both paths stay in lock step. Both are
  accepted together: `rows` first, then `children` below them.

  `float`: floats the box to the right of the article's prose; instead give it its own grid column in the
  page layout and never float it. Off by default, since a grid-column aside
  is the more common shape here, and opt-in per page with `float`.

  ARIA contract: `aria-label={title ?? label}` names the region — a real
  `title` is more specific than the generic default, so it wins.
  `data-testid="infobox"` is kept for e2e parity with the source apps.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Link from '../ui/Link.svelte';
  import InfoboxHeader from './InfoboxHeader.svelte';
  import InfoboxImage from './InfoboxImage.svelte';
  import InfoboxRow from './InfoboxRow.svelte';
  import InfoboxSection from './InfoboxSection.svelte';
  import {
    infoboxRowIsPresent,
    type InfoboxImageSpec,
    type InfoboxRowSpec as Row,
  } from './types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
    /** Heading of the rail; also its accessible name. */
    title?: string | undefined;
    /** A line under the title. */
    subtitle?: string | undefined;
    /**
     * Accessible name for the region when there is no `title`.
     * @defaultValue `'Key facts'`
     */
    label?: string | undefined;
    /** Renders an `InfoboxImage` above the body. */
    image?: InfoboxImageSpec | undefined;
    /** Rendered through the primitives below, inside one `InfoboxSection`. */
    rows?: readonly Row[] | undefined;
    /** float-right rail; off renders in normal flow (a grid column). */
    float?: boolean | undefined;
    /** Extra composed markup — `InfoboxSection`/`InfoboxRow`, or anything else. Rendered after `rows`. */
    children?: Snippet<[]> | undefined;
  }

  let {
    title,
    subtitle,
    label = 'Key facts',
    image,
    rows,
    float = false,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const presentRows = $derived((rows ?? []).filter(infoboxRowIsPresent));
  const imageRows = $derived(
    presentRows.filter((row): row is Extract<Row, { kind: 'image' }> => row.kind === 'image'),
  );
  const bodyRows = $derived(presentRows.filter((row) => row.kind !== 'image'));
</script>

<aside
  {...rest}
  data-testid="infobox"
  aria-label={title ?? label}
  class={[
    'card card-border bg-base-100 shadow-sm',
    float && 'float-right mb-4 ml-4 w-full sm:w-80',
    className,
  ]}
>
  {#if title !== undefined}
    <InfoboxHeader {title} {subtitle} />
  {/if}
  {#if image !== undefined}
    <InfoboxImage {...image} />
  {/if}
  {#each imageRows as row (row.src)}
    <InfoboxImage {...row} />
  {/each}
  {#if bodyRows.length > 0}
    <InfoboxSection>
      {#each bodyRows as row (row.label)}
        {#if row.kind === 'fact'}
          <InfoboxRow label={row.label} value={row.value} />
        {:else if row.kind === 'link'}
          <InfoboxRow label={row.label} value={row.text} href={row.href} external={row.external} />
        {:else if row.kind === 'links'}
          <InfoboxRow label={row.label}>
            <ul class="flex flex-col gap-1">
              {#each row.links ?? [] as link (link.href)}
                <li><Link href={link.href}>{link.label}</Link></li>
              {/each}
            </ul>
          </InfoboxRow>
        {:else if row.kind === 'custom'}
          <InfoboxRow label={row.label}>
            {@render row.content()}
          </InfoboxRow>
        {/if}
      {/each}
    </InfoboxSection>
  {/if}
  {@render children?.()}
</aside>

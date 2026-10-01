<!-- @component
A heading at any level with a stable `id`, optionally with a copyable anchor link.
-->
<!--
  Heading — a section heading at any level, with a stable `id` so the section
  is addressable: a table of contents, a "copy link to this section" anchor,
  a URL fragment someone pasted into a message.

  ARIA contract: a real `<h1>`–`<h6>` at the level the caller names. The level
  is a PROP and not a consequence of the styling, because the outline is a
  document structure and the type scale is a visual one; `class` overrides the
  latter without touching the former. `scroll-mt` keeps a hash target clear of
  a sticky header. The anchor link, when shown, has a real accessible name
  (`anchorLabel`); the `#` glyph beside it is decorative.

  The id is derived from `children` AT RENDER when `children` is a string —
  not measured from the mounted element in an `$effect`, which is how the
  gardeneria original did it and which means the server renders a heading with
  no id at all and every in-page link is dead until hydration. A snippet's
  text is not knowable before render, so a snippet heading that wants an
  anchor must be given an explicit `id`; without one the anchor is omitted
  rather than pointing at nothing.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { slugify } from './slug.ts';
  import type { HeadingLevel } from './tones.ts';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> {
    /** The heading level. */
    level: HeadingLevel;
    /** Explicit anchor id; derived from `children` when it is a string. */
    id?: string | undefined;
    /** Render a permalink beside the heading. Needs an id. */
    anchor?: boolean | undefined;
    /**
     * Accessible name of the permalink.
     * @defaultValue `'Link to this section'`
     */
    anchorLabel?: string | undefined;
    /** The heading text, as a string or a snippet. */
    children: Snippet<[]> | string;
  }

  let {
    level,
    id,
    anchor = false,
    anchorLabel = 'Link to this section',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const headingId = $derived(id ?? (typeof children === 'string' ? slugify(children) : undefined));

  const levelClasses: Record<HeadingLevel, string> = {
    1: 'mt-8 mb-6 text-3xl sm:text-4xl',
    2: 'mt-6 mb-4 text-2xl sm:text-3xl',
    3: 'mt-5 mb-3 text-xl sm:text-2xl',
    4: 'mt-4 mb-3 text-lg sm:text-xl',
    5: 'mt-4 mb-2 text-base sm:text-lg',
    6: 'mt-3 mb-2 text-sm sm:text-base',
  };
</script>

<svelte:element
  this={`h${level}`}
  {...rest}
  id={headingId}
  class={['group scroll-mt-16 font-bold', levelClasses[level], className]}
>
  {#if typeof children === 'string'}
    {children}
  {:else}
    {@render children()}
  {/if}
  {#if anchor && headingId !== undefined}
    <a
      href={`#${headingId}`}
      class="link link-hover text-base-content/40 ml-2 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
    >
      <span aria-hidden="true">#</span>
      <VisuallyHidden>{anchorLabel}</VisuallyHidden>
    </a>
  {/if}
</svelte:element>

<!-- @component
The "About: Rosa canina, Bed 4" row under a piece of content: a leading label, then a link per subject.
-->
<!--
  ContextLinks — the "About: Rosa canina, Bed 4" row under a piece of content:
  a leading label, then the things the content is about, each a link.

  Renders NOTHING when there are no links — the common case, since most
  content names no context, and an empty "About:" would be noise. Each href is
  resolved through the components context, like every app-relative link here.

  ARIA contract: a plain paragraph of links. The label is visible text read
  before the links, so no `aria-label` is needed; each link's own text is its
  accessible name.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  /** One thing the content is about. */
  export interface ContextLinkItem {
    /** App-relative path, resolved through the components context. */
    readonly href: string;
    readonly label: string;
  }

  interface Props extends HTMLAttributes<HTMLParagraphElement> {
    /** The subjects, each rendered as a link. */
    links: readonly ContextLinkItem[];
    /**
     * The leading word, rendered as `"<label>:"`.
     * @defaultValue `'About'`
     */
    label?: string | undefined;
  }

  let { links, label = 'About', class: className, ...rest }: Props = $props();

  const context = getComponentsContext();
</script>

{#if links.length > 0}
  <p {...rest} class={['text-base-content/70 flex flex-wrap gap-x-3 gap-y-1 text-sm', className]}>
    <span>{label}:</span>
    {#each links as entry, index (index)}
      <a class="link link-hover" href={context.href(entry.href)}>{entry.label}</a>
    {/each}
  </p>
{/if}

<!-- @component
The title block at the top of an `Infobox`.
-->
<!--
  InfoboxHeader — the title block at the top of an `Infobox`.

  An `h3` by default rather than an `h2`: the box sits beside an article's
  prose, and its title names the summary, not a section of the document.
  Promoting it to the level a real section heading would use puts a phantom
  entry in the page's outline between two real ones — the box is
  deliberately outside the outline.

  `headingLevel` raises (or lowers) it for a page that uses the box as a
  section in its own right, where `h3` would skip a level (`h1` → `h3`) or
  read as a sub-heading of the section before it. Only the tag changes; the
  classes are the same at every level. `1` is excluded: the box never titles
  the page.
-->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { HeadingLevel } from "../ui/tones.ts";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The infobox heading text. */
    title: string;
    /** A line under the heading. */
    subtitle?: string | undefined;
    /**
     * The heading's level. Keep the default when the box sits beside prose;
     * raise it to the page's section level when the box is a section itself.
     * @defaultValue `3`
     */
    headingLevel?: Exclude<HeadingLevel, 1> | undefined;
  }

  let {
    title,
    subtitle,
    headingLevel = 3,
    class: className,
    ...rest
  }: Props = $props();
</script>

<div
  {...rest}
  class={["border-base-300 bg-base-300 border-b px-4 py-3", className]}
>
  <svelte:element this={`h${headingLevel}`} class="text-center text-lg font-bold select-none">
    {title}
  </svelte:element>
  {#if subtitle !== undefined && subtitle !== ""}
    <p class="text-base-content/60 mt-1 text-center text-sm select-none">
      {subtitle}
    </p>
  {/if}
</div>

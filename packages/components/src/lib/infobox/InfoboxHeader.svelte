<!--
  InfoboxHeader — the title block at the top of an `Infobox`.

  An `h3` rather than an `h2`: the box sits beside an article's prose, and
  its title names the summary, not a section of the document. Promoting it
  to the level a real section heading would use puts a phantom entry in the
  page's outline between two real ones — the box is deliberately outside
  the outline, ported unchanged from gardeneria for that reason.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string | undefined;
  }

  let { title, subtitle, class: className, ...rest }: Props = $props();
</script>

<div {...rest} class={['border-base-300 bg-base-300 border-b px-4 py-3', className]}>
  <h3 class="text-center text-lg font-bold select-none">{title}</h3>
  {#if subtitle !== undefined && subtitle !== ''}
    <p class="text-base-content/60 mt-1 text-center text-sm select-none">{subtitle}</p>
  {/if}
</div>

<!-- @component
A titled group of `InfoboxRow`s, with dividing rules between them.
-->
<!--
  InfoboxSection — a titled group of `InfoboxRow`s, with the dividing rules
  between them.

  The `<dl>` lives here rather than on each row: a definition list whose
  terms and definitions are split across a dozen sibling lists is not one
  list, and a screen reader reading "list of 1 item" twelve times is the
  audible version of that mistake. Rows contribute the `<dt>`/`<dd>` pairs.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDListElement> {
    /** Names the group; omitted for an untitled run of rows. */
    title?: string | undefined;
    /** The rows — `InfoboxRow`s, or anything else that belongs in a `<dl>`. */
    children: Snippet<[]>;
  }

  let { title, children, class: className, ...rest }: Props = $props();
</script>

{#if title !== undefined && title !== ''}
  <div class="border-base-300 bg-base-300 border-b px-4 py-2">
    <h4 class="text-sm font-bold select-none">{title}</h4>
  </div>
{/if}
<dl {...rest} class={['divide-base-300 divide-y', className]}>
  {@render children()}
</dl>

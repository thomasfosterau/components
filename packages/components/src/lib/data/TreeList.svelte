<!--
  TreeList — one collapsible node of a hierarchy: a summary row that is always
  visible, and a subtree that folds away under it.

  Built on `<details>` / `<summary>` rather than a `{#if}` and a button, and
  deliberately NOT on a bits-ui primitive: the element already gives the
  disclosure semantics, the keyboard behaviour, and — on a modern browser —
  find-in-page inside the collapsed content, which no JavaScript
  implementation matches. A hand-rolled equivalent is three ARIA attributes
  that have to stay in step with each other.

  Open by default: a taxonomy the reader has to unfold node by node hides the
  shape they came to see. Pass `open={false}` where the subtree is an aside.

  ARIA contract: the platform's disclosure semantics, plus a `<ul>`/`<li>`
  structure so the nesting is announced as nesting. No `aria-expanded` is
  written by hand — the browser maps `open`, and a second copy can only ever
  disagree with it. This is a disclosure tree, not an ARIA `tree` widget:
  `role="tree"` would commit the caller to roving tabindex and typeahead over
  arbitrary nested content, which is a much larger promise than folding a
  taxonomy.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'title' | 'children'> {
    /** Whether the subtree starts unfolded. Bindable. */
    open?: boolean | undefined;
    /** The always-visible summary row — its own text, or richer markup. */
    title: string | Snippet<[]>;
    /** The subtree — typically nested `TreeListItem`s. */
    children?: Snippet<[]> | undefined;
  }

  let { open = $bindable(true), title, children, class: className, ...rest }: Props = $props();
</script>

<ul {...rest} class={['ml-1 pl-0', className]}>
  <li class="relative block pl-2">
    <details bind:open>
      <summary
        class="focus-visible:outline-primary block cursor-pointer marker:hidden focus:outline-hidden focus-visible:outline-1 focus-visible:outline-dotted"
      >
        {#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
      </summary>
      {@render children?.()}
    </details>
  </li>
</ul>

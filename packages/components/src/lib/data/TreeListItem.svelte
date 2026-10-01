<!-- @component
One leaf under a `TreeList`, drawn with the connector rule that makes the nesting readable.
-->
<!--
  TreeListItem — one leaf under a `TreeList`, drawn with the connector rule
  that makes the nesting readable.

  The rule is a border on the item rather than a line drawn between items, so
  a subtree that grows or folds redraws itself; `last:border-transparent`
  stops it running past the final child, which is the detail that separates a
  tree from a stack of indented rows.

  ARIA contract: a plain `<li>`. It is a list item inside its parent's list,
  and the nesting is the structure — nothing is added.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
    /** The leaf's content, beside the connector rule. */
    children?: Snippet<[]> | undefined;
  }

  let { children, class: className, ...rest }: Props = $props();
</script>

<li
  {...rest}
  class={[
    "border-base-300 border-l-2 before:absolute before:top-2 before:left-1 before:block before:content-['']",
    'last:border-transparent',
    className,
  ]}
>
  {@render children?.()}
</li>

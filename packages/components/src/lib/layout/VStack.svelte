<!-- @component
A vertical stack: children one above the next, on the spacing scale.
-->
<!--
  VStack — children in a column with a token gap (SwiftUI `VStack`, Compose `Column`). Tokens for gap and alignment come from `space.ts`, the
  library's spacing scale. See `Flow` for the list and divider rules.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Flow from './Flow.svelte';
  import type { FlowAlign, FlowElement, FlowJustify, Gap } from './space.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /**
     * Space between children.
     * @defaultValue `'md'`
     */
    gap?: Gap | undefined;
    /** Cross-axis alignment. */
    align?: FlowAlign | undefined;
    /** Main-axis distribution. */
    justify?: FlowJustify | undefined;
    /**
     * A decorative rule between children (never around them).
     * @defaultValue `false`
     */
    divider?: boolean | undefined;
    /**
     * The element. With `'ul'` / `'ol'`, children must be `<li>`s.
     * @defaultValue `'div'`
     */
    as?: FlowElement | undefined;
    children: Snippet<[]>;
  }

  let props: Props = $props();
</script>

<Flow direction="vertical" {...props} />

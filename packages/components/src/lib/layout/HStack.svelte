<!-- @component
A horizontal stack: children side by side, on the spacing scale; optionally a column below `sm`.
-->
<!--
  HStack — children in a row with a token gap (SwiftUI `HStack`, Compose `Row`). With `responsive`, a column on a narrow screen and a row from `sm` up. Tokens for gap and alignment come from `space.ts`, the
  library's spacing scale. See `Flow` for the list and divider rules.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Flow from './Flow.svelte';
  import type { FlowAlign, FlowElement, FlowJustify, Gap } from './space.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /**
     * Stack vertically below the `sm` breakpoint.
     * @defaultValue `false`
     */
    responsive?: boolean | undefined;
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

  let { responsive = false, ...props }: Props = $props();
</script>

<Flow direction={responsive ? 'responsive' : 'horizontal'} {...props} />

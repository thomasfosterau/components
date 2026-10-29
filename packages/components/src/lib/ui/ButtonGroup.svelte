<!-- @component
A named cluster of independent buttons in a daisyUI `join`; each stays its own Tab stop.
-->
<!--
  ButtonGroup — "Save | Save as… | Discard" on a form: presentational, a
  `role="group"` with a name, no keyboard behaviour by design. For a row of
  controls that should be ONE Tab stop with arrow keys, use `Toolbar`.

  Children join the bar by taking `class="join-item"` themselves. The
  group does not reach into them through a context, so `Button` stays
  free of any group coupling.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Accessible name of the group ("Save options"). */
    label: string;
    /**
     * `responsive` stacks below `sm`.
     * @defaultValue `'horizontal'`
     */
    orientation?: 'horizontal' | 'vertical' | 'responsive' | undefined;
    /** The buttons, each with `class="join-item"`. */
    children: Snippet<[]>;
  }

  let { label, orientation = 'horizontal', children, class: className, ...rest }: Props = $props();

  const orientationClass = {
    horizontal: '',
    vertical: 'join-vertical',
    responsive: 'join-vertical sm:join-horizontal',
  } as const;
</script>

<div {...rest} role="group" aria-label={label} class={['join', orientationClass[orientation], className]}>
  {@render children()}
</div>

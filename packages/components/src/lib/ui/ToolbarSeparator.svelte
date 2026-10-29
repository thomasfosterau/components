<!-- @component
A rule between groups of controls in a `Toolbar`, perpendicular to it.
-->
<!--
  ToolbarSeparator — `role="separator"` with the perpendicular
  `aria-orientation` (a vertical rule in a horizontal toolbar). Not
  focusable, so the arrow keys skip it.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /**
     * The orientation of the enclosing toolbar; the rule runs across it.
     * @defaultValue `'horizontal'`
     */
    toolbarOrientation?: 'horizontal' | 'vertical' | undefined;
  }

  let { toolbarOrientation = 'horizontal', class: className, ...rest }: Props = $props();

  const vertical = $derived(toolbarOrientation === 'horizontal');
</script>

<div
  {...rest}
  role="separator"
  aria-orientation={vertical ? 'vertical' : 'horizontal'}
  class={[
    vertical ? 'bg-base-300 mx-1 h-6 w-px self-center' : 'bg-base-300 my-1 h-px w-6 self-center',
    className,
  ]}
></div>

<!-- @component
A rule between groups of `MenuItem`s.
-->
<!--
  MenuSeparator — a rule between groups of `MenuItem`s.

  ARIA contract: a real `role="separator"`, which is what tells a screen
  reader the grouping exists at all; a bare styled `<li>` is a line sighted
  readers can see and nobody else can. In dropdown mode the role comes from
  bits-ui's own separator (which also marks it non-focusable for the menu's
  arrow-key navigation), wrapped in a `role="none"` `<li>` so the
  presentational list item stays out of the accessibility tree.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import { getMenuMode } from './menu-context.ts';

  interface Props {
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  let { class: className }: Props = $props();

  const mode = getMenuMode();
</script>

{#if mode() === 'dropdown'}
  <li role="none">
    <DropdownMenu.Separator class={['divider my-1 h-px', className]} />
  </li>
{:else}
  <li role="separator" class={['divider my-1 h-px', className]}></li>
{/if}

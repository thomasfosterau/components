<!-- @component
Internal: the bits-ui separator a `MenuSeparator` renders inside a `DropdownMenu` or `ContextMenu`.
-->
<!--
  bits-ui's own separator carries `role="separator"` and keeps it out of the
  menu's arrow-key navigation; the `role="none"` `<li>` keeps the
  presentational list item out of the accessibility tree. Lent to
  `MenuSeparator` through `menu-parts.ts`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { SeparatorPartProps } from './menu-parts.ts';

  let { class: className }: SeparatorPartProps = $props();
</script>

<li role="none">
  <DropdownMenu.Separator class={['divider my-1 h-px', className]} />
</li>

<!-- @component
Internal: the bits-ui separator a `MenuSeparator` renders inside a `DropdownMenu`.
-->
<!--
  bits-ui's own separator carries `role="separator"` and keeps it out of the
  menu's arrow-key navigation; the `role="none"` `<li>` keeps the
  presentational list item out of the accessibility tree. Lent to
  `MenuSeparator` through `dropdown-parts.ts`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { DropdownSeparatorPartProps } from './dropdown-parts.ts';

  let { class: className }: DropdownSeparatorPartProps = $props();
</script>

<li role="none">
  <DropdownMenu.Separator class={['divider my-1 h-px', className]} />
</li>

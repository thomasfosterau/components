<!-- @component
Flexible space inside a `VStack` / `HStack`: pushes what follows to the far end.
-->
<!--
  Spacer — SwiftUI's `Spacer()`, Compose's `Spacer(Modifier.weight(1f))`: an
  empty `flex-1` element. It carries nothing, so it is `aria-hidden`.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

  let { class: className, ...rest }: Props = $props();
</script>

<div {...rest} aria-hidden="true" class={['flex-1', className]}></div>

<!-- A `DescriptionRow` with NO enclosing `DescriptionList`, inside an app's
     own `<dl>`: the case the context defaults exist for.

     The value snippet is passed through an attribute rather than as body
     content, because body content compiles to a `children` snippet whether or
     not the `{#if}` inside it renders anything — so an `{#if}` in the body
     could never exercise the "no value at all" branch. -->
<script lang="ts">
  import DescriptionRow from '../../../src/lib/data/DescriptionRow.svelte';

  interface Props {
    label?: string;
    value?: string | number | undefined;
    showEmpty?: boolean;
    emptyLabel?: string | undefined;
    withChildren?: boolean;
  }

  let {
    label = 'Formula',
    value,
    showEmpty = false,
    emptyLabel,
    withChildren = false,
  }: Props = $props();
</script>

{#snippet licence()}
  <a href="/licences/cc-by">CC BY 4.0</a>
{/snippet}

<dl class="grid gap-2">
  <DescriptionRow
    {label}
    {value}
    {showEmpty}
    {emptyLabel}
    children={withChildren ? licence : undefined}
  />
</dl>

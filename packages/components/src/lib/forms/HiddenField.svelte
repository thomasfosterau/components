<!--
  HiddenField — a fixed value posted with the form and never edited: the
  parent id a create form hangs its row off, a command discriminator, a
  redirect target.

  It is a component rather than a bare `<input type="hidden">` so that a form
  described declaratively (a list of fields) can include one without dropping
  out of that description, and so the value passes through one place that
  stringifies it.

  ARIA contract: none, deliberately — a hidden input is not in the
  accessibility tree, and anything a reader needs to KNOW about does not
  belong in one.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value'> {
    /** The posted field name. */
    name: string;
    /** The posted value. */
    value: string | number;
  }

  let { name, value, ...rest }: Props = $props();
</script>

<input {...rest} type="hidden" {name} value={String(value)} />

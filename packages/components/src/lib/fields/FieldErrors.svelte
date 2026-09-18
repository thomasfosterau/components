<!--
  FieldErrors — the validation messages under one control: one `<p>` per
  message inside a single container.

  ARIA contract: the container is the live region (`role="alert"`), not each
  paragraph — a field that fails three rules should interrupt the reader once
  and then read all three, which is what one region holding three paragraphs
  does and what three regions do not. It carries the `id` a control points
  `aria-describedby` at, so the messages are also read on demand when focus
  reaches the control.

  Nothing is rendered while `errors` is empty. That is deliberate: a live
  region has to be IN the document before its content changes for the change
  to be announced, and inserting a populated region announces it, so the
  cheapest correct thing is to mount it only when there is something to say.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Messages to render, one paragraph each. */
    errors: readonly string[];
    /** The id a control's `aria-describedby` points at. */
    id?: string | undefined;
  }

  let { errors, id, class: className, ...rest }: Props = $props();
</script>

{#if errors.length > 0}
  <div {...rest} {id} role="alert" class={className}>
    {#each errors as message, index (index)}
      <p class="fieldset-label text-error">{message}</p>
    {/each}
  </div>
{/if}

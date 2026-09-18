<!--
  FormActions — the submit / cancel row that closes a form.

  ARIA contract: the submit control is a real `type="submit"` button, so
  Enter in any field still submits the form. While `pending` it is disabled
  AND `aria-busy="true"` (disabled alone says "you may not"; busy says "it is
  already happening") and its label swaps to `pendingLabel` — the button
  keeps a name throughout, which a spinner-only state would not.

  Cancel is a LINK, not a button: it navigates away, and a reader should be
  able to see where to before they commit to it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Button from '../ui/Button.svelte';
  import LinkButton from '../ui/LinkButton.svelte';
  import type { Tone } from '../ui/tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Idle label of the submit button. */
    submitLabel?: string | undefined;
    /** Label while the form is in flight. */
    pendingLabel?: string | undefined;
    /** The form is being submitted. */
    pending?: boolean | undefined;
    /** Extra disable condition — a required picker still empty, say. */
    disabled?: boolean | undefined;
    tone?: Tone | undefined;
    /** Where cancel goes. Omit for a form with no cancel affordance. */
    cancelHref?: string | undefined;
    cancelLabel?: string | undefined;
    /** Extra controls, rendered after cancel. */
    children?: Snippet<[]> | undefined;
  }

  let {
    submitLabel = 'Save',
    pendingLabel = 'Saving…',
    pending = false,
    disabled = false,
    tone = 'primary',
    cancelHref,
    cancelLabel = 'Cancel',
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<div {...rest} class={['flex flex-wrap items-center gap-3 pt-2', className]}>
  <Button type="submit" {tone} loading={pending} {disabled}>
    {pending ? pendingLabel : submitLabel}
  </Button>
  {#if cancelHref !== undefined}
    <LinkButton href={cancelHref} variant="ghost" disabled={pending}>{cancelLabel}</LinkButton>
  {/if}
  {@render children?.()}
</div>

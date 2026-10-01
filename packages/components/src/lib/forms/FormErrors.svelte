<!-- @component
The whole-form messages that belong to the submission rather than to any one field.
-->
<!--
  FormErrors — the whole-form messages: the ones that belong to the
  submission rather than to any one field ("That name is already taken",
  "Your session expired").

  ARIA contract: one `Alert` per message, each `live="assertive"`. Assertive
  is right here and would be wrong for page furniture: these appear in
  response to something the reader just did, and the next thing they will do
  is try again. Nothing is rendered while the list is empty, so the alert is
  inserted — and therefore announced — exactly when there is something to say.
-->
<script lang="ts">
  import Alert from '../ui/Alert.svelte';
  import type { StatusTone } from '../ui/tones.ts';

  interface Props {
    /** Whole-form messages. */
    messages?: readonly string[] | undefined;
    /**
     * Colour of the alert.
     * @defaultValue `'error'`
     */
    tone?: StatusTone | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  let { messages, tone = 'error', class: className }: Props = $props();
</script>

{#each messages ?? [] as message, index (index)}
  <Alert {tone} live="assertive" class={className}>{message}</Alert>
{/each}

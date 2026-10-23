<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import PinInput from '../../../src/lib/fields/PinInput.svelte';

  interface Props {
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
    onComplete?: ((code: string) => void) | undefined;
    errors?: readonly string[] | undefined;
    charset?: 'numeric' | 'alphanumeric' | undefined;
    value?: string | undefined;
  }

  let { onSubmitted, onComplete, errors, charset, value = $bindable('') }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Sign-in code" hint="We emailed you a six-digit code." {errors}>
    {#snippet children(control)}
      <PinInput {...control} name="code" {charset} {onComplete} bind:value />
    {/snippet}
  </FormField>
  <button type="submit">Sign in</button>
</form>
<p data-testid="bound">{value}</p>

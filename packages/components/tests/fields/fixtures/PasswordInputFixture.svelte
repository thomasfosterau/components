<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import PasswordInput from '../../../src/lib/fields/PasswordInput.svelte';

  interface Props {
    purpose?: 'current' | 'new' | undefined;
    revealable?: boolean | undefined;
    errors?: readonly string[] | undefined;
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { purpose, revealable, errors, onSubmitted }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Password" hint="At least 12 characters." {errors}>
    {#snippet children(control)}
      <PasswordInput
        {...control}
        {purpose}
        {revealable}
        name="password"
        minlength={12}
        data-testid="password-input"
        class="wrapper-class"
        value="hunter2hunter2"
      />
    {/snippet}
  </FormField>
  <button type="submit">Sign in</button>
</form>

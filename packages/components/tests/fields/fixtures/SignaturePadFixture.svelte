<!-- A SignaturePad inside a FormField and a form, with the value bound. -->
<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import type { SignatureValue } from '../../../src/lib/fields/signature.ts';
  import SignaturePad from '../../../src/lib/fields/SignaturePad.svelte';

  interface Props {
    value?: SignatureValue | undefined;
    required?: boolean | undefined;
    allowTyped?: boolean | undefined;
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { value = $bindable(undefined), required = false, allowTyped, onSubmitted }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Signature" {required}>
    {#snippet children(control)}
      <SignaturePad {...control} {allowTyped} name="signature" bind:value />
    {/snippet}
  </FormField>
  <button type="submit">Submit</button>
</form>
<p data-testid="kind">{value?.kind ?? 'none'}</p>
<p data-testid="typed">{value?.typedName ?? ''}</p>
<p data-testid="paths">{(value?.svg.match(/<path/g) ?? []).length}</p>

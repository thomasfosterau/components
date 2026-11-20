<script lang="ts">
  import CheckboxGroup from '../../../src/lib/fields/CheckboxGroup.svelte';
  import RadioGroup from '../../../src/lib/fields/RadioGroup.svelte';

  interface Props {
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { onSubmitted }: Props = $props();

  const plans = [
    { value: 'free', label: 'Free', description: 'One garden.' },
    { value: 'pro', label: 'Pro', description: 'Unlimited gardens.' },
  ];
  const beds = [
    { value: 'raised', label: 'Raised bed', description: 'Drains well.' },
    { value: 'pots', label: 'Containers' },
  ];
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <RadioGroup legend="Plan" name="plan" variant="cards" options={plans} />
  <CheckboxGroup legend="Beds" name="beds" variant="cards" options={beds} />
  <button type="submit">Save</button>
</form>

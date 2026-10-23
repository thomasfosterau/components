<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import PinInput from '../../lib/fields/PinInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/PinInput',
    component: PinInput,
    parameters: {
      docs: {
        description: {
          component:
            'A fixed-length code typed one character per cell into ONE real input, on bits-ui’s `PinInput`: paste, SMS autofill, password managers and form posting all treat it as one field. Paste “123 456” or “123-456” to see the default transformer.',
        },
      },
    },
  });
</script>

<Story name="Numeric (inside FormField)">
  <FormField label="Sign-in code" hint="We emailed you a six-digit code.">
    {#snippet children(control)}
      <PinInput {...control} name="code" />
    {/snippet}
  </FormField>
</Story>

<Story name="Alphanumeric">
  <FormField label="Invite code">
    {#snippet children(control)}
      <PinInput {...control} charset="alphanumeric" length={8} size="sm" />
    {/snippet}
  </FormField>
</Story>

<Story name="Masked PIN">
  <FormField label="PIN">
    {#snippet children(control)}
      <PinInput {...control} length={4} masked value="12" size="lg" />
    {/snippet}
  </FormField>
</Story>

<Story name="Invalid">
  <FormField label="Sign-in code" errors={['That code has expired. Request a new one.']}>
    {#snippet children(control)}
      <PinInput {...control} value="123456" />
    {/snippet}
  </FormField>
</Story>

<Story name="Paste">
  <FormField label="Sign-in code" hint="Paste “123 456” from the email; spaces and hyphens are dropped.">
    {#snippet children(control)}
      <PinInput {...control} />
    {/snippet}
  </FormField>
</Story>

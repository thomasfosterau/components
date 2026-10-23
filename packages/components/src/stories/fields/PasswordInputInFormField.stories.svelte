<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import PasswordInput from '../../lib/fields/PasswordInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/PasswordInput/Inside FormField',
    component: PasswordInput,
  });
</script>

<Story name="Sign-up">
  <div class="max-w-sm">
    <FormField label="New password" hint="At least 12 characters." errors={['Too short.']} required>
      {#snippet children(control)}
        <PasswordInput {...control} purpose="new" name="password" minlength={12} value="short" />
      {/snippet}
    </FormField>
  </div>
</Story>

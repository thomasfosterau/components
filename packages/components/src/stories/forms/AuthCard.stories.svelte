<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import AuthCard from '../../lib/forms/AuthCard.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import PasswordInput from '../../lib/fields/PasswordInput.svelte';
  import Alert from '../../lib/ui/Alert.svelte';

  const { Story } = defineMeta({
    title: 'Forms/AuthCard',
    component: AuthCard,
    parameters: {
      docs: {
        description: {
          component:
            'The centred card for a sign-in, sign-up or password-reset page: a POST form with the heading, form errors, an email field, the page’s own fields, a link to the sibling page and a submit button. Enhancement comes from `enhance` or the components context; the submit button shows `pendingLabel` while the enhanced request is in flight.',
        },
      },
    },
  });
</script>

<Story name="Sign in" asChild>
  <AuthCard
    title="Sign in"
    description="Welcome back."
    redirectTo="/gardens"
    altHref="/sign-up"
    altLabel="Create an account"
    submitLabel="Sign in"
    pendingLabel="Signing in…"
  >
    {#snippet fields()}
      <FormField label="Password" required>
        {#snippet children(control)}
          <PasswordInput {...control} name="password" />
        {/snippet}
      </FormField>
    {/snippet}
  </AuthCard>
</Story>

<Story name="After a failed sign-in" asChild>
  <AuthCard
    title="Sign in"
    errors={['Those details did not match an account.']}
    email="ada@example"
    emailErrors={['Enter a valid email address.']}
    altHref="/sign-up"
    altLabel="Create an account"
    submitLabel="Sign in"
  />
</Story>

<Story name="Magic link sent" asChild>
  <AuthCard title="Sign in" submitLabel="Send another link" email="ada@example.com">
    {#snippet notice()}
      <Alert tone="info">Check your inbox for a sign-in link.</Alert>
    {/snippet}
  </AuthCard>
</Story>

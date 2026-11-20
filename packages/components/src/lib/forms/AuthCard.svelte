<!-- @component
The centred card for a sign-in, sign-up or password-reset page: a POST form with a heading, form errors, an email field, the page's own fields, a link to the sibling page and a submit button.
-->
<!--
  AuthCard — the shell every auth page repeats. The page supplies only its
  copy and the fields after the email (`fields`), and reads the action's
  outcome through `onResult` if it needs to (analytics, a toast).

  Enhancement comes from `enhance`, else the components context's. It is
  handed a `FormSubmission`; the submit button shows `pendingLabel` and is
  disabled and `aria-busy` from its `onSubmit` until its `onResult`. With no
  enhancement the form is a plain POST, so it works with scripting off.

  ARIA contract: the title is a real heading at `headingLevel`. The email
  control is named by its `FormField` label and described by its errors.
  Form-level errors are assertive alerts (`FormErrors`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLFormAttributes } from 'svelte/elements';
  import {
    getComponentsContext,
    type EnhanceForm,
    type FormSubmission,
  } from '../context.svelte.ts';
  import FormField from '../fields/FormField.svelte';
  import TextInput from '../fields/TextInput.svelte';
  import Button from '../ui/Button.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';
  import FormErrors from './FormErrors.svelte';
  import HiddenField from './HiddenField.svelte';

  interface Props extends Omit<HTMLFormAttributes, 'children'> {
    /** The heading. */
    title: string;
    /**
     * The heading's level.
     * @defaultValue `1`
     */
    headingLevel?: HeadingLevel | undefined;
    /** A line under the heading. */
    description?: string | undefined;
    /** Where to go once signed in; posted as a hidden field. Omitted, no field is posted. */
    redirectTo?: string | undefined;
    /**
     * The hidden redirect field's name.
     * @defaultValue `'redirectTo'`
     */
    redirectName?: string | undefined;
    /** Form-level errors from the failed action. */
    errors?: readonly string[] | undefined;
    /**
     * Render the email field.
     * @defaultValue `true`
     */
    showEmail?: boolean | undefined;
    /** The email field's repopulated value. */
    email?: string | undefined;
    /** The email field's errors. */
    emailErrors?: readonly string[] | undefined;
    /**
     * The email field's label.
     * @defaultValue `'Email'`
     */
    emailLabel?: string | undefined;
    /** The link to the sibling page (sign up from sign in). Rendered with `altLabel`. */
    altHref?: string | undefined;
    /** The sibling link's text. */
    altLabel?: string | undefined;
    /** The submit button's label. */
    submitLabel: string;
    /**
     * The submit button's label while the enhanced request is in flight.
     * @defaultValue the `submitLabel`
     */
    pendingLabel?: string | undefined;
    /** This form's enhancement; falls back to the components context's. */
    enhance?: EnhanceForm | undefined;
    /** Called with the enhanced action's result once it settles. */
    onResult?: ((result: { readonly type: string }) => void) | undefined;
    /** Rendered between the heading and the errors, e.g. a "check your inbox" alert. */
    notice?: Snippet<[]> | undefined;
    /** The page's own fields, after the email field. */
    fields?: Snippet<[]> | undefined;
  }

  let {
    title,
    headingLevel = 1,
    description,
    redirectTo,
    redirectName = 'redirectTo',
    errors,
    showEmail = true,
    email,
    emailErrors,
    emailLabel = 'Email',
    altHref,
    altLabel,
    submitLabel,
    pendingLabel,
    enhance,
    onResult,
    notice,
    fields,
    method = 'POST',
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  let pending = $state(false);

  const submission: FormSubmission = {
    onSubmit: () => {
      pending = true;
    },
    onResult: (result) => {
      pending = false;
      onResult?.(result);
    },
  };

  /** The given `enhance`, else the context's, as an attachment so having neither is a no-op. */
  const enhanceForm = (node: HTMLFormElement): void | (() => void) =>
    (enhance ?? context.enhance)?.(node, submission);
</script>

<div class="flex justify-center py-8">
  <section class="card card-border bg-base-100 w-full max-w-md shadow-sm">
    <form {...rest} {method} class={['card-body gap-4', className]} {@attach enhanceForm}>
      {#if redirectTo !== undefined}
        <HiddenField name={redirectName} value={redirectTo} />
      {/if}

      <div class="space-y-2">
        <svelte:element this={`h${headingLevel}`} class="text-3xl font-bold">{title}</svelte:element>
        {#if description !== undefined}
          <p class="text-base-content/70">{description}</p>
        {/if}
      </div>

      {@render notice?.()}

      <FormErrors messages={errors} />

      {#if showEmail}
        <FormField label={emailLabel} errors={emailErrors} required>
          {#snippet children(control)}
            <TextInput {...control} type="email" name="email" autocomplete="email" value={email ?? ''} />
          {/snippet}
        </FormField>
      {/if}

      {@render fields?.()}

      <div class="card-actions mt-2 items-center justify-between gap-3">
        {#if altHref !== undefined && altLabel !== undefined}
          <a class="link link-primary link-hover" href={context.href(altHref)}>{altLabel}</a>
        {/if}
        <Button type="submit" tone="primary" loading={pending} class="ms-auto">
          {pending ? (pendingLabel ?? submitLabel) : submitLabel}
        </Button>
      </div>
    </form>
  </section>
</div>

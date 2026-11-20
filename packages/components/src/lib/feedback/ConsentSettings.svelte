<!-- @component
The per-category consent form for a cookie settings page: one switch per category, required ones on and disabled, and a Save button.
-->
<!--
  ConsentSettings — where a reader changes or withdraws a choice, as easily
  as they gave it.

  ARIA contract: a `<form>` named by `title`, one `Toggle` per category
  (named by its label, described by its description), and a polite
  `role="status"` that says `savedLabel` after a save. A required
  category's switch is on and disabled. Before the reader has chosen,
  every optional switch starts off. With `action` the form posts each
  enabled category's id as `consent` before scripts load.
-->
<script lang="ts">
  import type { HTMLFormAttributes } from 'svelte/elements';
  import Toggle from '../fields/Toggle.svelte';
  import Button from '../ui/Button.svelte';
  import { getConsent, type ConsentApi } from './consent.svelte.ts';

  interface Props extends Omit<HTMLFormAttributes, 'title'> {
    /** The store; the one `setConsent` published when omitted. */
    consent?: ConsentApi | undefined;
    /**
     * The form's heading and accessible name.
     * @defaultValue `'Cookie settings'`
     */
    title?: string | undefined;
    /**
     * @defaultValue `'Save cookie settings'`
     */
    saveLabel?: string | undefined;
    /**
     * Announced after a save.
     * @defaultValue `'Your cookie settings were saved.'`
     */
    savedLabel?: string | undefined;
  }

  let {
    consent: consentProp,
    title = 'Cookie settings',
    saveLabel = 'Save cookie settings',
    savedLabel = 'Your cookie settings were saved.',
    action,
    class: className,
    ...rest
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const consent = consentProp ?? getConsent();
  const titleId = $props.id();

  const current = (): Record<string, boolean> =>
    Object.fromEntries(
      consent.categories.map((category) => [category.id, consent.hasConsent(category.id)]),
    );

  let draft = $state(current());
  let saved = $state(false);

  const save = (event: SubmitEvent): void => {
    event.preventDefault();
    consent.set(draft);
    draft = current();
    saved = true;
  };
</script>

<form
  {...rest}
  method="post"
  {action}
  aria-labelledby={titleId}
  class={['flex flex-col gap-4', className]}
  onsubmit={save}
>
  <h2 id={titleId} class="text-lg font-semibold">{title}</h2>
  {#each consent.categories as category (category.id)}
    {#if category.required === true}
      <Toggle label={category.label} description={category.description} checked disabled />
    {:else}
      <Toggle
        label={category.label}
        description={category.description}
        name="consent"
        value={category.id}
        bind:checked={
          () => draft[category.id] === true,
          (on) => {
            draft[category.id] = on;
            saved = false;
          }
        }
      />
    {/if}
  {/each}
  <div><Button type="submit" tone="primary">{saveLabel}</Button></div>
  <p role="status" class="text-sm">{saved ? savedLabel : ''}</p>
</form>

<!-- @component
A cookie and third-party content consent banner: Accept and Reject with equal weight, a link to the settings, and a confirmation once the reader chooses.
-->
<!--
  ConsentBanner — asks once, while the store holds no choice.

  ARIA contract: a `<section>` region named by its heading, meant to be the
  first thing in `<body>`. It is not a dialog: it traps nothing, blocks
  nothing and is not announced, so a screen reader meets it in reading
  order. Accept and Reject are the same `Button` in the same tone and
  variant, since a buried Reject is the dark pattern regulators fine. After
  a choice the banner is replaced by a confirmation, which takes focus so
  the outcome is read; its Hide button removes it and moves focus to
  `<main>`.

  With `action`, the buttons sit in a `<form method="post">` that posts
  `consent=accept|reject`, so the choice works before scripts load; once
  they have, the store records it and nothing is posted.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { focusElement } from '../layout/focus-target.ts';
  import Button from '../ui/Button.svelte';
  import Link from '../ui/Link.svelte';
  import ConsentConfirmation from './ConsentConfirmation.svelte';
  import { getConsent, type ConsentApi } from './consent.svelte.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
    /** The store; the one `setConsent` published when omitted. */
    consent?: ConsentApi | undefined;
    /**
     * The banner's heading and accessible name.
     * @defaultValue `'Cookies on this site'`
     */
    title?: string | undefined;
    /** What the app would like to set, and why. */
    children: Snippet<[]>;
    /** The cookie settings page, linked from the banner and the confirmation. */
    settingsHref?: string | undefined;
    /** A POST target for the choice before scripts load; posts `consent=accept|reject`. */
    action?: string | undefined;
    /**
     * @defaultValue `'Accept analytics cookies'`
     */
    acceptLabel?: string | undefined;
    /**
     * @defaultValue `'Reject analytics cookies'`
     */
    rejectLabel?: string | undefined;
    /**
     * The link to `settingsHref` in the banner.
     * @defaultValue `'View cookies'`
     */
    manageLabel?: string | undefined;
    /**
     * The confirmation after accepting.
     * @defaultValue `'You’ve accepted analytics cookies.'`
     */
    acceptedLabel?: string | undefined;
    /**
     * The confirmation after rejecting.
     * @defaultValue `'You’ve rejected analytics cookies.'`
     */
    rejectedLabel?: string | undefined;
    /**
     * The link to `settingsHref` in the confirmation.
     * @defaultValue `'Change your cookie settings'`
     */
    changeLabel?: string | undefined;
    /**
     * The button that removes the confirmation.
     * @defaultValue `'Hide this message'`
     */
    hideLabel?: string | undefined;
    /** Replaces the confirmation's message; `hide` removes it as the Hide button does. */
    confirmation?: Snippet<[{ accepted: boolean; hide: () => void }]> | undefined;
  }

  let {
    consent: consentProp,
    title = 'Cookies on this site',
    children,
    settingsHref,
    action,
    acceptLabel = 'Accept analytics cookies',
    rejectLabel = 'Reject analytics cookies',
    manageLabel = 'View cookies',
    acceptedLabel = 'You’ve accepted analytics cookies.',
    rejectedLabel = 'You’ve rejected analytics cookies.',
    changeLabel = 'Change your cookie settings',
    hideLabel = 'Hide this message',
    confirmation,
    class: className,
    ...rest
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const consent = consentProp ?? getConsent();
  const titleId = $props.id();

  /** Whether the reader accepted, in this visit; `undefined` until they choose. */
  let outcome: boolean | undefined = $state();
  let hidden = $state(false);

  const choose = (accepted: boolean): void => {
    if (accepted) consent.acceptAll();
    else consent.rejectAll();
    outcome = accepted;
  };

  /** A click records the choice unless the form will: then `submit` does, so it is recorded once. */
  const pick = (accepted: boolean): void => {
    if (action === undefined) choose(accepted);
  };

  const submit = (event: SubmitEvent): void => {
    event.preventDefault();
    const submitter = event.submitter;
    choose(submitter instanceof HTMLButtonElement && submitter.value === 'accept');
  };

  const hide = (): void => {
    hidden = true;
    const main = document.querySelector('main');
    if (main instanceof HTMLElement) focusElement(main);
  };

  // Accept and Reject share every visual prop: parity is the requirement.
  const choiceButton = { tone: 'primary', variant: 'solid' } as const;
</script>

{#snippet buttons()}
  {@const type = action === undefined ? 'button' : 'submit'}
  <Button {...choiceButton} {type} name="consent" value="accept" onclick={() => pick(true)}>
    {acceptLabel}
  </Button>
  <Button {...choiceButton} {type} name="consent" value="reject" onclick={() => pick(false)}>
    {rejectLabel}
  </Button>
  {#if settingsHref !== undefined}
    <Link href={settingsHref}>{manageLabel}</Link>
  {/if}
{/snippet}

{#if outcome !== undefined && !hidden}
  <ConsentConfirmation
    {...rest}
    class={className}
    {title}
    accepted={outcome}
    message={outcome ? acceptedLabel : rejectedLabel}
    {settingsHref}
    {changeLabel}
    {hideLabel}
    {hide}
    {confirmation}
  />
{:else if outcome === undefined && consent.choice === undefined}
  <section {...rest} class={['bg-base-200 p-4', className]} aria-labelledby={titleId}>
    <div class="mx-auto flex max-w-5xl flex-col gap-3">
      <h2 id={titleId} class="text-lg font-semibold">{title}</h2>
      <div class="flex flex-col gap-2">{@render children()}</div>
      {#if action === undefined}
        <div class="flex flex-wrap items-center gap-3">{@render buttons()}</div>
      {:else}
        <form method="post" {action} class="flex flex-wrap items-center gap-3" onsubmit={submit}>
          {@render buttons()}
        </form>
      {/if}
    </div>
  </section>
{/if}

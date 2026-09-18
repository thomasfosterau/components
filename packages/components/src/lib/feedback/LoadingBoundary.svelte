<!--
  LoadingBoundary — the loading and error chrome around one read.

  The four states exist because "not settled" is two different things, and
  collapsing them is what made every mutation blank its list back to
  "Loading…": `loading` is a FIRST read with nothing to show yet, while
  `refreshing` is a re-fetch over content that is already on screen. Children
  keep rendering through `refreshing` — only a first read or a failure shows
  chrome instead of content.

  The two `tone`s are the two treatments the app repos had, not a new pair:
  `page` is a route's own read, where the message stands alone under the page
  heading, and `section` is a detail page's secondary read, indented into the
  flow and deliberately quiet so a failed sidebar section degrades on its own
  instead of taking the page with it.

  ARIA contract: the loading chrome is a polite `role="status"` named by what
  it is loading, so a reader who arrives mid-fetch is told rather than
  finding nothing. During `refreshing` the same announcement is made from a
  visually hidden status, because the content is still there to read. A
  failure is assertive: the reader is waiting for something that is not
  coming.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Alert from '../ui/Alert.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';

  interface Props {
    /** Where the read has got to. */
    state: 'loading' | 'refreshing' | 'error' | 'ready';
    /** Announced, and shown, while the first read is in flight. */
    loadingLabel?: string | undefined;
    /** The message for a failed read. Every call site has a specific one. */
    errorLabel?: string | undefined;
    /** Which of the two established treatments to render. */
    tone?: 'page' | 'section' | undefined;
    class?: string | undefined;
    /** Replaces the default loading chrome. */
    loading?: Snippet<[]> | undefined;
    /** Replaces the default error chrome. */
    failed?: Snippet<[{ message: string }]> | undefined;
    /** The loaded content. Rendered from the first success onwards. */
    children: Snippet<[]>;
  }

  let {
    state,
    loadingLabel = 'Loading…',
    errorLabel = 'That didn’t load. Try again.',
    tone = 'page',
    class: className,
    loading,
    failed,
    children,
  }: Props = $props();
</script>

{#if state === 'error'}
  {#if failed}
    {@render failed({ message: errorLabel })}
  {:else if tone === 'section'}
    <p role="alert" class={['text-base-content/60 mt-3 text-sm leading-6', className]}>
      {errorLabel}
    </p>
  {:else}
    <Alert tone="error" live="assertive" class={className}>{errorLabel}</Alert>
  {/if}
{:else if state === 'loading'}
  {#if loading}
    {@render loading()}
  {:else}
    <p
      role="status"
      class={[
        tone === 'section' ? 'text-base-content/50 mt-3 text-sm' : 'text-base-content/50',
        className,
      ]}
    >
      {loadingLabel}
    </p>
  {/if}
{:else}
  {#if state === 'refreshing'}
    <VisuallyHidden role="status">{loadingLabel}</VisuallyHidden>
  {/if}
  {@render children()}
{/if}

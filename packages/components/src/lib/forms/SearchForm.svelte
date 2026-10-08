<!-- @component
The site search box: a `<search>` landmark around a GET form that works without JavaScript.
-->
<!--
  SearchForm — the site search box: a `<search>` landmark around a GET form
  that works with no JavaScript at all.

  Method GET on purpose. A search is a request for a REPRESENTATION, so its
  result should be a URL people can bookmark, share and go back to; a POST
  would make the results page un-linkable and re-submit on refresh.

  ARIA contract: `<search>` is the landmark (so "go to search" reaches it
  without an `aria-label` per instance), the visible label is visually hidden
  but real — `for`/`id`, not a `placeholder`, which disappears the moment
  someone types and is not a name at all — and the submit button carries its
  own text rather than an icon alone.

  `action` resolves through the components context, so an app with a base path
  or a locale prefix gets the right URL without this file knowing about either.
-->
<script lang="ts">
  import type { HTMLFormAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import Button from '../ui/Button.svelte';

  interface Props extends Omit<HTMLFormAttributes, 'action' | 'method'> {
    /** Where the search submits — an app path, resolved through the context. */
    action: string;
    /**
     * The query parameter's name.
     * @defaultValue `'q'`
     */
    name?: string | undefined;
    /**
     * The query. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * Accessible name of the field.
     * @defaultValue `'Search'`
     */
    label?: string | undefined;
    /**
     * Text of the submit button.
     * @defaultValue `'Search'`
     */
    submitLabel?: string | undefined;
    /** Placeholder in the field. */
    placeholder?: string | undefined;
    /**
     * Refuse to submit an empty query.
     * @defaultValue `true`
     */
    required?: boolean | undefined;
  }

  let {
    action,
    name = 'q',
    value = $bindable(''),
    label = 'Search',
    submitLabel = 'Search',
    placeholder,
    required = true,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const resolved = $derived(context.href(action));
  const uid = $props.id();
</script>

<search class={['block', className]}>
  <form {...rest} action={resolved} method="get" class="join w-full">
    <label class="sr-only" for={uid}>{label}</label>
    <input
      id={uid}
      class="input join-item w-full"
      type="search"
      {name}
      {placeholder}
      {required}
      bind:value
    />
    <Button type="submit" tone="primary" class="join-item">{submitLabel}</Button>
  </form>
</search>

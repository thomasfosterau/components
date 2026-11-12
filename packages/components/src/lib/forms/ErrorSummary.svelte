<!-- @component
A focused "There is a problem" list of a form's field errors, each a link that moves focus to its field.
-->
<!--
  ErrorSummary — the GOV.UK error summary: after a failed submission, one
  alert at the top of the form that says the submission failed and lists every
  field error as a link to the field.

  It sits beside, not instead of, the other two error surfaces. `FieldErrors`
  (inside `FormField`) says what is wrong under each control, `FormErrors`
  holds messages with no field to attach to, and this summary repeats both in
  one place so a reader on a long form, or a screen-reader user who hears
  nothing from a reloaded page, learns at once that it failed and where. The
  duplication is by design.

  ARIA contract: a `role="alert"` region with `tabindex="-1"` labelled by its
  `<h2>` title, containing a `<ul>` of `<a href="#fieldId">` links. Nothing is
  rendered while there is nothing to list, so the region is inserted, and
  announced, when there is something to say.

  Focus: `role="alert"` alone is not reliably announced on page load, so the
  summary is also focused — on mount with errors (a server-rendered POST
  response), when the errors go from none to some, when a field that was not
  in error becomes so, and when `focusKey` changes (a re-submit that fails the
  same way). Fixing fields one by one, or the message on a field changing as
  the reader types, does not move focus: "the same set" is the set of field
  ids (plus form-level messages), not of message texts.

  Links: without JavaScript `href="#id"` is the platform's own jump. With it a
  click focuses the control (or, for a group or a role-based widget, its first
  focusable part) and scrolls its label or legend into view rather than just
  the input (the GOV.UK behaviour).

  `document.title` is prefixed with `titlePrefix` (unless it is empty) while the summary shows and
  put back when the errors clear or the component unmounts.

  Hand-rolled rather than bits-ui: there is no widget behaviour here beyond
  focus and links, and no bits-ui primitive models an alert summary.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { focusTarget } from '../layout/focus-target.ts';
  import Alert from '../ui/Alert.svelte';
  import {
    errorSummaryItems,
    type ErrorSummaryItem,
    type ErrorSummaryRecord,
  } from './error-summary.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
    /**
     * One entry per field message, in form order, or a field-name to messages
     * record (linked through `formId`). Nothing renders when this and
     * `formErrors` are both empty.
     */
    errors: readonly ErrorSummaryItem[] | ErrorSummaryRecord;
    /** With a record in `errors`, the form id the field ids are derived from (`fieldId(formId, name)`). */
    formId?: string | undefined;
    /** Form-level messages, listed above the field links without a link. */
    formErrors?: readonly string[] | undefined;
    /**
     * The summary's heading.
     * @defaultValue `'There is a problem'`
     */
    title?: string | undefined;
    /**
     * Move focus to the summary when it appears or its set of fields changes.
     * @defaultValue `true`
     */
    autofocus?: boolean | undefined;
    /**
     * A value that changes on every submission attempt. While errors show, a
     * change to a defined value refocuses the summary even when the errors are
     * the same ones. `undefined` never refocuses.
     */
    focusKey?: string | number | undefined;
    /**
     * Prefix for `document.title` while the summary shows; an empty string leaves the title alone.
     * @defaultValue `'Error: '`
     */
    titlePrefix?: string | undefined;
    /** The summary's `id`. Minted when omitted. */
    id?: string | undefined;
  }

  let {
    errors,
    formId = '',
    formErrors = [],
    title = 'There is a problem',
    autofocus = true,
    focusKey,
    titlePrefix = 'Error: ',
    id: idProp,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  const titleId = $derived(`${id}-title`);

  const items = $derived<readonly ErrorSummaryItem[]>(
    Array.isArray(errors) ? errors : errorSummaryItems(errors as ErrorSummaryRecord, formId),
  );
  const visible = $derived(items.length > 0 || formErrors.length > 0);

  // What identifies an entry for "has the set changed": a field by its id, so
  // a message that changes as the reader types is the same entry; a
  // form-level message by its text.
  const entryKeys = $derived(
    new Set([
      ...items.map((item) => `field:${item.fieldId}`),
      ...formErrors.map((message) => `form:${message}`),
    ]),
  );

  // Focus bookkeeping, deliberately not reactive: it is read and written only
  // inside the effect below.
  let mounted = false;
  let previous = new Set<string>();
  let lastKey: string | number | undefined;

  $effect(() => {
    const current = entryKeys;
    const key = focusKey;
    const wanted = autofocus;
    const keyChanged = key !== undefined && key !== lastKey;
    const appeared = [...current].some((entry) => !previous.has(entry));
    const first = !mounted;
    mounted = true;
    previous = current;
    if (key !== undefined) lastKey = key;
    if (current.size === 0 || !wanted) return;
    if (first || appeared || keyChanged) document.getElementById(id)?.focus();
  });

  $effect(() => {
    if (!visible || titlePrefix === '') return;
    const prefix = titlePrefix;
    const current = document.title;
    // A server-rendered title already carries the prefix.
    const base = current.startsWith(prefix) ? current.slice(prefix.length) : current;
    const prefixed = prefix + base;
    document.title = prefixed;
    return () => {
      // Leave a title the app changed in the meantime alone.
      if (document.title === prefixed) document.title = base;
    };
  });

  const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
  const usable = (element: HTMLElement): boolean =>
    element.tabIndex >= 0 && !element.hasAttribute('disabled');

  // The element that takes focus for `target`: the control itself, else its
  // first focusable descendant (a group's first member, a slider's thumb).
  const focusableIn = (target: HTMLElement): HTMLElement | undefined =>
    usable(target)
      ? target
      : Array.from(target.querySelectorAll<HTMLElement>(FOCUSABLE)).find(usable);

  // What to bring into view: the visible label, or the legend of a group.
  const labelFor = (target: HTMLElement): HTMLElement | null =>
    document.getElementById(`${target.id}-label`) ??
    document.querySelector<HTMLElement>(`label[for="${CSS.escape(target.id)}"]`) ??
    (target instanceof HTMLFieldSetElement ? target.querySelector('legend') : null) ??
    target.closest('fieldset')?.querySelector('legend') ??
    null;

  const goTo = (event: MouseEvent, fieldId: string): void => {
    const target = document.getElementById(fieldId);
    // No such element: leave the link to the platform's own fragment jump.
    if (target === null) return;
    event.preventDefault();
    const focusable = focusableIn(target);
    if (focusable === undefined) focusTarget(fieldId, { preventScroll: true });
    else focusable.focus({ preventScroll: true });
    (labelFor(target) ?? target).scrollIntoView({ block: 'center' });
  };
</script>

{#if visible}
  <Alert
    {...rest}
    {id}
    tone="error"
    live="assertive"
    tabindex={-1}
    aria-labelledby={titleId}
    class={['scroll-mt-4 focus:outline-2 focus:outline-offset-2', className]}
  >
    <h2 id={titleId} class="font-semibold">{title}</h2>
    {#if formErrors.length > 0}
      <div class="mt-1 space-y-1">
        {#each formErrors as message, index (index)}
          <p>{message}</p>
        {/each}
      </div>
    {/if}
    {#if items.length > 0}
      <ul class="mt-1 list-disc ps-5">
        {#each items as item, index (index)}
          <li>
            <a
              href={`#${item.fieldId}`}
              class="link link-hover font-medium"
              onclick={(event) => goTo(event, item.fieldId)}>{item.message}</a
            >
          </li>
        {/each}
      </ul>
    {/if}
  </Alert>
{/if}

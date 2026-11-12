<!-- @component
Renders an `@thomasfosterau/effect-forms-svelte` `defineEntityForm` definition through this library’s field primitives.
-->
<!--
  EntityForm — the generic renderer for an `@thomasfosterau/effect-forms-svelte`
  `defineEntityForm` definition: it walks `definition.entriesFor(mode)` and
  renders each entry through this library's field primitives —
  `FormField` + `TextInput` / `DateInput` / `Textarea` / `Select` for scalars
  and selects, and the entry's own component for a bespoke widget (a picker,
  a contributor list), bridged through the widget contract below.

  The one component of this package that touches Effect, which is why it is a
  separate entry point (`@thomasfosterau/components/entity-form`) with
  `@thomasfosterau/effect-forms-svelte` an OPTIONAL peer: a consumer that
  never imports this entry never installs the form library or `effect`.
  `effect` is an optional peer of this package for the same reason: the
  renderer imports its `Layer`, `Option`, `Predicate` and `Record` modules.

  **The store.** A `FormStore` over the definition's all-string input record
  (`EntityFormData`), validated by the mode's `createInput` / `updateInput`.
  It is constructed directly rather than through `createForm`, whose seed
  overloads take only a schema whose decoded and encoded types are form data
  trees: the definition types its input schemas `Command.FormInputField`
  (`Schema.Codec<unknown, unknown>`), though each is a struct of strings at
  runtime. The store's own constructor takes any service-free schema, so the
  data type is stated here instead of asserted. Each entry is addressed by the
  focus `form.root.key(entry.key)`.

  **Seeding.** `definition`, `mode`, `initial` and `initialRows` configure the
  store ONCE, at mount: a form never changes entity or mode mid-flight, and an
  edit page's values must land in the SSR HTML. There is no `$effect`
  re-seeding, so a value typed before hydration is never wiped by a late seed.
  A create form whose command carries a client id gets one minted here, once
  per mount, so a retried submission stays idempotent.

  **The widget contract.** A widget entry receives, in this order: its
  definition's `props()`, then the caller's `fieldProps[key]`, then the bridge
  — `name`, `value`, `onChange`, `errors`. The bridge is spread LAST, so
  neither of the first two can sever the store binding. A `value` widget
  bridges a string field of the store; a `rows` widget bridges a row list held
  here and serialises it itself (its own hidden input).

  **Submission.** `enhance(form)` supplies the spreadable `<form>` attributes.
  It defaults to the store's own `form.props` (POST + its progressive
  enhancement); a SvelteKit app passes its `$app/forms`-backed `enhanceForm`,
  which this package cannot import.

  **Form-level messages.** The store's `formErrors` and the caller's
  `messages` (a failure the store never saw, such as a server action's
  `fail(500, { message })`) share one `FormErrors` block, store errors first.

  **Error summary.** `errorSummary` renders an `ErrorSummary` at the top of
  the form: every field's visible errors, in entry order, each linking to the
  control (`entity-form-<key>`, the id of every scalar and select field; a
  widget links to that id only if it puts it on its focusable part), and the
  form-level messages above them. It replaces the separate `FormErrors` block
  rather than nesting alerts in alerts. It takes focus only once the form has
  been submitted (or was posted, `isPosted`), and again on every further
  failed attempt.

  **Unsaved changes.** `saveBar` adds a `SaveBar` inside the form: it shows
  while the store has tainted fields (or a `rows` widget has been changed), Save is the form's own submit and Discard is the store's `reset()`
  plus the rows' seed, so nothing is duplicated. Pair it with
  `bind:dirty` and `createLeaveGuard({ dirty: () => dirty })` in the page to guard navigation.

  Accessibility: each control is labelled by its `FormField`, field errors are
  reached through `aria-describedby`, and root errors and `messages` are
  `FormErrors` alerts (one `role="alert"` each).

  Every string that is not the definition's own (labels, submit labels and
  option labels are its message thunks) is a prop with an English default.
-->
<script lang="ts">
  import {
    FormStore,
    type EntityFormDefinition,
    type ScalarEntry,
    type SelectEntry,
    type WidgetEntry,
  } from '@thomasfosterau/effect-forms-svelte';
  import * as Layer from 'effect/Layer';
  import * as Option from 'effect/Option';
  import * as P from 'effect/Predicate';
  import * as R from 'effect/Record';
  import type { ComponentProps } from 'svelte';
  import type { HTMLFormAttributes } from 'svelte/elements';
  import DateInput from '../fields/DateInput.svelte';
  import type { FieldControl } from '../fields/field-types.ts';
  import FormField from '../fields/FormField.svelte';
  import Select from '../fields/Select.svelte';
  import TextInput from '../fields/TextInput.svelte';
  import Textarea from '../fields/Textarea.svelte';
  import FormActions from './FormActions.svelte';
  import ErrorSummary from './ErrorSummary.svelte';
  import { errorSummaryItems, fieldId } from './error-summary.ts';
  import FormErrors from './FormErrors.svelte';
  import SaveBar from './SaveBar.svelte';

  /** The store's data: the definition's all-string input, one value per entry key (absent until set). */
  type EntityFormData = Readonly<Record<string, string | undefined>>;
  /** The store `enhance` receives: validated by the mode's input schema, over {@link EntityFormData}. */
  type Store = FormStore<EntityFormDefinition['createInput'], EntityFormData>;
  /** A widget entry's own props: its definition's `props()` shape (`WidgetOwnProps`), owned by the form library. */
  type WidgetProps = ReturnType<WidgetEntry['props']>;
  /** What the renderer bridges into a widget, spread after its own props. */
  type WidgetBridge =
    | {
        readonly name: string;
        readonly value: unknown[];
        readonly onChange: (next: unknown[]) => void;
        readonly errors: readonly string[];
      }
    | {
        readonly name: string;
        readonly value: string;
        readonly onChange: (next: string) => void;
        readonly errors: readonly string[];
      };

  interface Props extends Omit<HTMLFormAttributes, 'action' | 'method' | 'children'> {
    /** The form definition from `defineEntityForm`. */
    definition: EntityFormDefinition;
    /** Which of the definition’s entry sets to render. */
    mode: 'create' | 'update';
    /** Where Cancel goes. Omitted renders no cancel link. */
    cancelHref?: string | undefined;
    /** A named action (`?/addItem`). Omitted posts to the page's default action. */
    action?: string | undefined;
    /**
     * All-string initial values: an edit page's current values, or a create page's pre-filled FK.
     * @defaultValue `{}`
     */
    initial?: Readonly<Record<string, string>> | undefined;
    /**
     * Initial rows per `rows` widget key (a contributor list's current credits).
     * @defaultValue `{}`
     */
    initialRows?: Readonly<Record<string, readonly unknown[]>> | undefined;
    /**
     * Render-time extra props per widget key (a picker's load-resolved `options`).
     * @defaultValue `{}`
     */
    fieldProps?: Readonly<Record<string, Readonly<WidgetProps>>> | undefined;
    /**
     * The spreadable `<form>` attributes for this store.
     * @defaultValue the store's own `form.props`
     */
    enhance?: ((form: Store) => Store['props']) | undefined;
    /**
     * Text of the cancel link.
     * @defaultValue `'Cancel'`
     */
    cancelLabel?: string | undefined;
    /**
     * Submit button text while the form is submitting.
     * @defaultValue `'Saving…'`
     */
    pendingLabel?: string | undefined;
    /**
     * The empty option of a select entry.
     * @defaultValue `'Choose…'`
     */
    selectPlaceholder?: string | undefined;
    /**
     * Read out after a required field’s label.
     * @defaultValue `'(required)'` (from `FormField`)
     */
    requiredLabel?: string | undefined;
    /**
     * Form-level messages from outside the store — a server action's failure
     * message that carries no form state (`page.form?.message`, wrapped in an
     * array). Rendered in the same `FormErrors` block as the store's own root
     * errors, after them, one `role="alert"` each. The text is shown as given.
     */
    messages?: readonly string[] | undefined;
    /**
     * Show an `ErrorSummary` at the top of the form (a list of every field
     * error linking to its field, focused after a failed submission) in place
     * of the plain `FormErrors` block. Pass an object to change its copy.
     * @defaultValue `false`
     */
    errorSummary?:
      | boolean
      | {
          /** The summary's heading, `'There is a problem'` by default. */
          readonly title?: string | undefined;
          /** The `document.title` prefix while it shows, `'Error: '` by default; empty disables it. */
          readonly titlePrefix?: string | undefined;
        }
      | undefined;
    /**
     * Show a `SaveBar` while the form has unsaved changes.
     * @defaultValue `false`
     */
    saveBar?: boolean | undefined;
    /**
     * Whether the form has unsaved changes; output only, for `bind:dirty` into a leave guard.
     * @defaultValue `false`
     */
    dirty?: boolean | undefined;
    /** Props for the save bar (`position`, labels, `confirmDiscard`); the form owns `dirty`, `saving`, Save and Discard. */
    saveBarProps?:
      | Omit<ComponentProps<typeof SaveBar>, 'dirty' | 'form' | 'onSave' | 'onDiscard' | 'saving'>
      | undefined;
  }

  let {
    definition,
    mode,
    cancelHref,
    action,
    initial = {},
    initialRows = {},
    fieldProps = {},
    enhance = (form) => form.props,
    cancelLabel = 'Cancel',
    pendingLabel = 'Saving…',
    selectPlaceholder = 'Choose…',
    requiredLabel,
    messages,
    errorSummary = false,
    saveBar = false,
    dirty = $bindable(false),
    saveBarProps,
    class: className,
    ...rest
  }: Props = $props();

  // Configure-once, at mount (see the header): these reads are deliberately
  // not reactive.
  // svelte-ignore state_referenced_locally
  const configured = { definition, mode, initial, initialRows };

  const baseDefaults =
    configured.mode === 'create'
      ? configured.definition.createDefaults
      : configured.definition.updateDefaults;
  const mintedId =
    configured.mode === 'create' && configured.definition.clientId
      ? { id: crypto.randomUUID() }
      : undefined;
  const defaults = { ...baseDefaults, ...configured.initial, ...mintedId };

  // The blank, unposted state `createForm`'s seed overload would build (see
  // the header for why the store is constructed directly).
  const form: Store = new FormStore<EntityFormDefinition['createInput'], EntityFormData>(
    { id: 'default', isValid: true, isPosted: false, data: defaults, errors: {} },
    {
      schema:
        configured.mode === 'create'
          ? configured.definition.createInput
          : configured.definition.updateInput,
      layer: Layer.empty,
    },
  );
  const entries = configured.definition.entriesFor(configured.mode);
  const seedRows = (): Record<string, unknown[]> =>
    R.fromEntries(
      entries
        .filter((entry) => P.isTagged(entry, 'widget') && entry.bridge === 'rows')
        .map((entry) => [entry.key, [...(configured.initialRows[entry.key] ?? [])]]),
    );

  // Every entry key is a key of the all-string input record, so its focus is
  // a total lens: an absent key reads as `undefined`, and a write sets it.
  const focus = (key: string) => form.root.key(key);
  const getField = (key: string): string => form.get(focus(key)) ?? '';
  const setField = (key: string, next: string): void => {
    form.set(focus(key), next);
  };
  const fieldErrors = (key: string): readonly string[] => form.visibleErrorsAt(focus(key));

  let rows: Record<string, unknown[]> = $state(seedRows());
  let rowsChanged = $state(false);
  const isDirty = $derived(form.isTainted || rowsChanged);
  $effect(() => {
    dirty = isDirty;
  });
  const discard = (): void => {
    form.reset();
    rows = seedRows();
    rowsChanged = false;
  };

  const bridge = (entry: WidgetEntry): WidgetBridge =>
    entry.bridge === 'rows'
      ? {
          name: entry.key,
          value: rows[entry.key] ?? [],
          onChange: (next: unknown[]) => {
            rows[entry.key] = next;
            rowsChanged = true;
          },
          errors: fieldErrors(entry.key),
        }
      : {
          name: entry.key,
          value: getField(entry.key),
          onChange: (next: string) => setField(entry.key, next),
          errors: fieldErrors(entry.key),
        };

  const selectOptions = (entry: SelectEntry) =>
    (configured.definition.fieldFor(entry.key).options ?? []).map((value) => ({
      value,
      label: entry.options.optionLabels[value]?.() ?? value,
    }));

  const inputMode = (entry: ScalarEntry): Option.Option<'numeric'> =>
    Option.orElse(Option.fromNullishOr(entry.options.inputmode), () =>
      configured.definition.fieldFor(entry.key).kind === 'number'
        ? Option.some('numeric')
        : Option.none(),
    );

  const showHiddenId = configured.mode === 'update' || configured.definition.clientId;
  const submitLabel = $derived(
    mode === 'create' ? definition.submit.create() : definition.submit.update(),
  );
  const gated = $derived(
    entries.some(
      (entry) => P.isTagged(entry, 'widget') && entry.options.gate === true && getField(entry.key) === '',
    ),
  );
  // The form's own (non-field) messages, then the caller's `messages` (a
  // server fault with no form state).
  const rootErrors = $derived([...form.formErrors, ...(messages ?? [])]);
  const FORM_ID = 'entity-form';
  const controlId = (key: string): string => fieldId(FORM_ID, key);
  const summary = $derived(errorSummary === false ? undefined : errorSummary);
  const summaryItems = $derived(
    errorSummaryItems(
      R.fromEntries(entries.map((entry) => [entry.key, fieldErrors(entry.key)])),
      FORM_ID,
    ),
  );
  // The `FormField` wrapper is the same for a select and a scalar entry.
  const fieldAttrs = (entry: SelectEntry | ScalarEntry) => ({
    id: controlId(entry.key),
    label: entry.options.label(),
    required: entry.options.required === true,
    errors: fieldErrors(entry.key),
    requiredLabel,
  });
</script>

<!-- A scalar entry's control: a textarea, a date input or a text input. -->
{#snippet scalarInput(entry: ScalarEntry, control: FieldControl)}
  {#if entry.multiline}
    <Textarea
      {...control}
      name={entry.key}
      placeholder={entry.options.placeholder?.()}
      bind:value={() => getField(entry.key), (next: string) => setField(entry.key, next)}
    />
  {:else if entry.options.type === 'date'}
    <DateInput
      {...control}
      name={entry.key}
      bind:value={() => getField(entry.key), (next: string) => setField(entry.key, next)}
    />
  {:else}
    <TextInput
      {...control}
      name={entry.key}
      type={entry.options.type === 'url' ? 'url' : 'text'}
      inputmode={Option.getOrUndefined(inputMode(entry))}
      placeholder={entry.options.placeholder?.()}
      bind:value={() => getField(entry.key), (next: string) => setField(entry.key, next)}
    />
  {/if}
{/snippet}

<form {...rest} {...enhance(form)} {action} class={['space-y-4', className]}>
  {#if showHiddenId}
    <input type="hidden" name="id" value={getField('id')} />
  {/if}

  {#if summary === undefined}
    <FormErrors messages={rootErrors} />
  {:else}
    <ErrorSummary
      errors={summaryItems}
      formErrors={rootErrors}
      autofocus={form.isSubmitted || form.isPosted}
      focusKey={form.isSubmitted && !form.submitting ? form.submissionAttempts : undefined}
      title={summary === true ? undefined : summary.title}
      titlePrefix={summary === true ? undefined : summary.titlePrefix}
    />
  {/if}

  {#each entries as entry (entry.key)}
    {#if entry._tag === 'widget'}
      <entry.component {...entry.props()} {...fieldProps[entry.key] ?? {}} {...bridge(entry)} />
    {:else if entry._tag === 'select'}
      <FormField {...fieldAttrs(entry)}>
        {#snippet children(control)}
          <Select
            {...control}
            name={entry.key}
            options={selectOptions(entry)}
            placeholder={selectPlaceholder}
            bind:value={() => getField(entry.key), (next: string) => setField(entry.key, next)}
          />
        {/snippet}
      </FormField>
    {:else}
      <FormField {...fieldAttrs(entry)}>
        {#snippet children(control)}
          {@render scalarInput(entry, control)}
        {/snippet}
      </FormField>
    {/if}
  {/each}

  <FormActions
    {submitLabel}
    {pendingLabel}
    pending={form.submitting}
    disabled={gated}
    {cancelHref}
    {cancelLabel}
  />

  {#if saveBar}
    <SaveBar {...saveBarProps} dirty={isDirty} saving={form.submitting} onDiscard={discard} />
  {/if}
</form>

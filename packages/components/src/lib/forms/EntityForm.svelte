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
  never imports this entry never installs the form library or `effect`. The
  renderer itself imports only the store (`createForm`) and types.

  Ported from the three apps' renderers with preferenceflow's (the newest, and
  already on this library's field API) as the reference, plus website's
  `rows` bridge and `action` prop.

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

  Every string that is not the definition's own (labels, submit labels and
  option labels are its message thunks) is a prop with an English default.
-->
<script lang="ts">
  import {
    createForm,
    type EntityFormDefinition,
    type EntityFormEntry,
    type FieldHandle,
  } from '@thomasfosterau/effect-forms-svelte';
  import type { HTMLFormAttributes } from 'svelte/elements';
  import DateInput from '../fields/DateInput.svelte';
  import FormField from '../fields/FormField.svelte';
  import Select from '../fields/Select.svelte';
  import TextInput from '../fields/TextInput.svelte';
  import Textarea from '../fields/Textarea.svelte';
  import FormActions from './FormActions.svelte';
  import FormErrors from './FormErrors.svelte';

  type Store = ReturnType<typeof createForm>;

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
    fieldProps?: Readonly<Record<string, Readonly<Record<string, unknown>>>> | undefined;
    /**
     * The spreadable `<form>` attributes for this store.
     * @defaultValue the store's own `form.props`
     */
    enhance?: ((form: Store) => Record<string | symbol, unknown>) | undefined;
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
     * @defaultValue `FormField`'s
     */
    requiredLabel?: string | undefined;
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
  const defaults: Record<string, string> = { ...baseDefaults, ...configured.initial };
  if (configured.mode === 'create' && configured.definition.clientId) {
    defaults['id'] = crypto.randomUUID();
  }

  const form = createForm({
    schema:
      configured.mode === 'create'
        ? configured.definition.createInput
        : configured.definition.updateInput,
    defaults,
  });
  const entries = configured.definition.entriesFor(configured.mode);

  // `defineEntityForm` validated every entry key against the derived
  // all-string input schema, which the path-typed accessor cannot see.
  const handle = (key: string): FieldHandle<string | undefined> =>
    form.field(key as never) as unknown as FieldHandle<string | undefined>;
  const getField = (key: string): string => handle(key).value ?? '';
  const setField = (key: string, next: string): void => {
    handle(key).value = next;
  };

  type WidgetEntry = Extract<EntityFormEntry, { _tag: 'widget' }>;
  type SelectEntry = Extract<EntityFormEntry, { _tag: 'select' }>;
  type ScalarEntry = Extract<EntityFormEntry, { _tag: 'scalar' }>;

  let rows: Record<string, unknown[]> = $state(
    Object.fromEntries(
      entries
        .filter((entry) => entry._tag === 'widget' && entry.bridge === 'rows')
        .map((entry) => [entry.key, [...(configured.initialRows[entry.key] ?? [])]]),
    ),
  );

  const bridge = (entry: WidgetEntry): Record<string, unknown> =>
    entry.bridge === 'rows'
      ? {
          name: entry.key,
          value: rows[entry.key] ?? [],
          onChange: (next: unknown[]) => {
            rows[entry.key] = next;
          },
          errors: handle(entry.key).visibleErrors,
        }
      : {
          name: entry.key,
          value: getField(entry.key),
          onChange: (next: string) => setField(entry.key, next),
          errors: handle(entry.key).visibleErrors,
        };

  const selectOptions = (entry: SelectEntry) =>
    (configured.definition.fieldFor(entry.key).options ?? []).map((value) => ({
      value,
      label: entry.options.optionLabels[value]?.() ?? value,
    }));

  const inputMode = (entry: ScalarEntry): 'numeric' | undefined =>
    entry.options.inputmode ??
    (configured.definition.fieldFor(entry.key).kind === 'number' ? 'numeric' : undefined);

  const showHiddenId = configured.mode === 'update' || configured.definition.clientId;
  const submitLabel = $derived(
    mode === 'create' ? definition.submit.create() : definition.submit.update(),
  );
  const gated = $derived(
    entries.some(
      (entry) => entry._tag === 'widget' && entry.options.gate === true && getField(entry.key) === '',
    ),
  );
  const rootErrors = $derived((form.errors as { readonly _errors?: readonly string[] })._errors ?? []);
  const fieldId = (key: string): string => `entity-form-${key}`;
</script>

<form {...rest} {...enhance(form)} {action} class={['space-y-4', className]}>
  {#if showHiddenId}
    <input type="hidden" name="id" value={getField('id')} />
  {/if}

  <FormErrors messages={rootErrors} />

  {#each entries as entry (entry.key)}
    {#if entry._tag === 'widget'}
      <entry.component {...entry.props()} {...fieldProps[entry.key] ?? {}} {...bridge(entry)} />
    {:else if entry._tag === 'select'}
      <FormField
        id={fieldId(entry.key)}
        label={entry.options.label()}
        required={entry.options.required === true}
        errors={handle(entry.key).visibleErrors}
        {requiredLabel}
      >
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
      <FormField
        id={fieldId(entry.key)}
        label={entry.options.label()}
        required={entry.options.required === true}
        errors={handle(entry.key).visibleErrors}
        {requiredLabel}
      >
        {#snippet children(control)}
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
              inputmode={inputMode(entry)}
              placeholder={entry.options.placeholder?.()}
              bind:value={() => getField(entry.key), (next: string) => setField(entry.key, next)}
            />
          {/if}
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
</form>

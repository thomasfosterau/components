<!-- @component
A data import as a guided flow: pick a file, check how it is read, match its columns to the app's fields, and import the records the app's Schema decodes.
-->
<!--
  ImportMapper — its four steps in order: `ImportSource`
  (pick the file, detect its format, choose a table), `ImportReadOptions`
  (the header row and the rows to skip, previewed live), `ImportFieldMap`
  (match columns to target fields, pre-filled from the headers) and
  `ImportSubmit` (map every row, report issues, hand the records to
  `onSubmit`). The review grid is a later addition.

  A required field with no column blocks going on: the attempt shows each
  such field's error and moves focus to the first of them. Going back keeps
  every choice; choosing another file or table starts the read and the map
  again. Changing the read keeps the columns the user chose and re-seeds
  the suggestions from the new headers.

  `onSubmit`'s `records` are values of the target's Schema type, so an app's
  `S` flows from `importTarget(schema)` to the records it receives. Each step
  component's own copy can be overridden through `sourceProps`,
  `readOptionsProps`, `fieldMapProps` and `submitProps`.

  ARIA contract: the steps are core `Steps`, an ordered list named by
  `label` with `aria-current="step"` on the current one. Each step's panel is
  a `region` named by its heading, and moving to another step moves focus to
  that heading (it takes `tabindex="-1"`). Progress, detection and outcomes
  are announced through each step's polite status region.
-->
<script lang="ts" generics="S extends ServiceFreeTarget">
  import { Button, Steps } from '@thomasfosterau/components';
  import {
    sourceTableFromRegion,
    type ImportTarget,
    type SourceRead,
  } from '@thomasfosterau/components-import';
  import { tick, type ComponentProps } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ImportFieldMap from './ImportFieldMap.svelte';
  import ImportReadOptions from './ImportReadOptions.svelte';
  import ImportSource from './ImportSource.svelte';
  import ImportSubmit from './ImportSubmit.svelte';
  import {
    defaultRead,
    missingRequired,
    specFor,
    type FieldChoices,
    type ServiceFreeTarget,
    type ImportFile,
    type ImportFormat,
    type ImportResult,
    type InvalidRowPolicy,
  } from './session.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The import target, from `importTarget(schema)`: what a record is. */
    target: ImportTarget<S>;
    /** The formats the app accepts, such as `[Csv.format]` from `@thomasfosterau/effect-document/csv`. */
    formats: readonly ImportFormat[];
    /** Called with the records when the user imports them; the signal aborts if the mapper goes away. */
    onSubmit: (result: ImportResult<S['Type']>, signal: AbortSignal) => Promise<void>;
    /**
     * What rows that do not decode do to submitting: `'block'` needs none, `'exclude'` leaves them out, `'allow'` passes them on.
     * @defaultValue `'block'`
     */
    invalidRows?: InvalidRowPolicy | undefined;
    /** The most rows an import takes; a larger table is refused. Omitted, there is no cap. */
    maxRows?: number | undefined;
    /**
     * The heading level of each step's title.
     * @defaultValue `2`
     */
    headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
    /**
     * The step list's accessible name.
     * @defaultValue `'Import progress'`
     */
    label?: string | undefined;
    /**
     * The first step's name.
     * @defaultValue `'Choose a file'`
     */
    sourceLabel?: string | undefined;
    /**
     * The second step's name.
     * @defaultValue `'Check the table'`
     */
    readOptionsLabel?: string | undefined;
    /**
     * The third step's name.
     * @defaultValue `'Match the columns'`
     */
    fieldMapLabel?: string | undefined;
    /**
     * The last step's name.
     * @defaultValue `'Import'`
     */
    submitLabel?: string | undefined;
    /**
     * The button back to the previous step.
     * @defaultValue `'Back'`
     */
    backLabel?: string | undefined;
    /**
     * The button on to the next step.
     * @defaultValue `'Continue'`
     */
    continueLabel?: string | undefined;
    /** Copy and options for the source step; `formats` and `source` are the mapper's. */
    sourceProps?: Omit<ComponentProps<typeof ImportSource>, 'formats' | 'source'> | undefined;
    /** Copy and options for the read options step; the table and read are the mapper's. */
    readOptionsProps?: Omit<ComponentProps<typeof ImportReadOptions>, 'table' | 'read'> | undefined;
    /** Copy and options for the field map; the target, table, read and choices are the mapper's. */
    fieldMapProps?:
      | Omit<
          ComponentProps<typeof ImportFieldMap<S>>,
          'target' | 'table' | 'read' | 'choices' | 'showErrors'
        >
      | undefined;
    /** Copy and options for the last step; the target, spec, table, policy, cap and callback are the mapper's. */
    submitProps?:
      | Omit<
          ComponentProps<typeof ImportSubmit<S>>,
          'target' | 'spec' | 'table' | 'onSubmit' | 'invalidRows' | 'maxRows'
        >
      | undefined;
  }

  let {
    target,
    formats,
    onSubmit,
    invalidRows = 'block',
    maxRows,
    headingLevel = 2,
    label = 'Import progress',
    sourceLabel = 'Choose a file',
    readOptionsLabel = 'Check the table',
    fieldMapLabel = 'Match the columns',
    submitLabel = 'Import',
    backLabel = 'Back',
    continueLabel = 'Continue',
    sourceProps,
    readOptionsProps,
    fieldMapProps,
    submitProps,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();

  let step = $state(0);
  let source = $state.raw<ImportFile | undefined>(undefined);
  let read = $state.raw<SourceRead>({ skipRows: 0 });
  let choices = $state.raw<FieldChoices>({});
  let showErrors = $state(false);
  let heading = $state<HTMLElement | undefined>(undefined);
  let panel = $state<HTMLElement | undefined>(undefined);

  const steps = $derived([
    { id: 'source', label: sourceLabel },
    { id: 'read', label: readOptionsLabel },
    { id: 'fields', label: fieldMapLabel },
    { id: 'submit', label: submitLabel },
  ]);
  const titles = $derived([sourceLabel, readOptionsLabel, fieldMapLabel, submitLabel]);
  const last = 3;

  // A new file or table starts the map again, from the table's own header guess.
  let mappedTable: unknown = undefined;
  $effect.pre(() => {
    const table = source?.table;
    if (table === mappedTable) return;
    mappedTable = table;
    read = table === undefined ? { skipRows: 0 } : defaultRead(table);
    choices = {};
    showErrors = false;
  });

  const table = $derived(source === undefined ? undefined : sourceTableFromRegion(source.table, read));
  const spec = $derived(
    source === undefined || table === undefined ? undefined : specFor(source, read, table, choices),
  );

  const goTo = async (next: number): Promise<void> => {
    step = next;
    await tick();
    heading?.focus();
  };

  const advance = async (): Promise<void> => {
    if (step < 2) {
      if (source !== undefined) await goTo(step + 1);
      return;
    }
    if (missingRequired(target, choices).length > 0) {
      showErrors = true;
      await tick();
      panel?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    await goTo(last);
  };
</script>

<div {...rest} class={['flex flex-col gap-6', className]}>
  <Steps items={steps} current={step} {label} />

  <section class="flex flex-col gap-4" aria-labelledby={`${uid}-heading`} bind:this={panel}>
    <svelte:element
      this={`h${headingLevel}`}
      id={`${uid}-heading`}
      tabindex="-1"
      class="text-lg font-semibold focus:outline-none"
      bind:this={heading}
    >
      {titles[step]}
    </svelte:element>

    {#if step === 0}
      <ImportSource {...sourceProps} {formats} bind:source />
    {:else if step === 1 && source !== undefined}
      <ImportReadOptions {...readOptionsProps} table={source.table} bind:read />
    {:else if step === 2 && source !== undefined}
      <ImportFieldMap {...fieldMapProps} {target} table={source.table} {read} bind:choices {showErrors} />
    {:else if step === last && spec !== undefined && table !== undefined}
      <ImportSubmit {...submitProps} {target} {spec} {table} {onSubmit} {invalidRows} {maxRows} />
    {/if}
  </section>

  <div class="flex gap-2">
    {#if step > 0}
      <Button type="button" variant="ghost" onclick={() => goTo(step - 1)}>{backLabel}</Button>
    {/if}
    {#if step < last}
      <Button type="button" tone="primary" disabled={step === 0 && source === undefined} onclick={advance}>
        {continueLabel}
      </Button>
    {/if}
  </div>
</div>

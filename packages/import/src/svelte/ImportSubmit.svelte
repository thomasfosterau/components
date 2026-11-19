<!-- @component
The import's last step: map every row of the table, report the rows that do not fit, and hand the records to the app.
-->
<!--
  ImportSubmit — maps the whole table with the spec (the engine streams the
  rows, and the progress is announced), then says how many records are ready
  and lists the rows that did not decode, each issue with its row and field.
  What those rows do to submitting is `invalidRows`: `'block'` disables the
  import button while any remain, `'exclude'` leaves them out and says how
  many, `'allow'` passes them on in `invalid`. The import button calls
  `onSubmit(result, signal)` and shows its progress and any failure; the
  signal aborts when the step goes away.

  There is no editing here yet: the review grid (inline fixes, excluding rows
  one by one) is a later slice of #139, so `edits` is always empty.

  ARIA contract: progress and the outcome go through a polite `role="status"`
  region, a failure through an `Alert`'s `role="alert"`. Issues are a list
  whose items read as text ("Row 4, Email: …") with a visually hidden
  "Issue" label beside an `aria-hidden` icon, so nothing rests on colour.
-->
<script lang="ts" generics="S extends ServiceFreeTarget">
  import { Alert, Button } from '@thomasfosterau/components';
  import type {
    ImportSpec,
    ImportTarget,
    SourceTable,
  } from '@thomasfosterau/components-import';
  import * as Option from 'effect/Option';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    mapTable,
    type ServiceFreeTarget,
    StepError,
    type ImportResult,
    type InvalidRowPolicy,
    type MappedTable,
  } from './session.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The import target, from `importTarget(schema)`. */
    target: ImportTarget<S>;
    /** The mapping to apply. */
    spec: ImportSpec;
    /** The whole table, read as the spec says. */
    table: SourceTable;
    /** Called with the records when the user imports them; the signal aborts if the step goes away. */
    onSubmit: (result: ImportResult<S['Type']>, signal: AbortSignal) => Promise<void>;
    /**
     * What rows that do not decode do to submitting.
     * @defaultValue `'block'`
     */
    invalidRows?: InvalidRowPolicy | undefined;
    /** The most rows the import takes; a larger table is refused. Omitted, there is no cap. */
    maxRows?: number | undefined;
    /**
     * How many rows with issues are listed.
     * @defaultValue `20`
     */
    issueLimit?: number | undefined;
    /**
     * Announced while mapping: rows done and the total.
     * @defaultValue `'Mapped 250 of 1000 rows.'`, in that shape
     */
    progressMessage?: ((done: number, total: number) => string) | undefined;
    /**
     * How many records are ready.
     * @defaultValue `'3 records are ready to import.'`, in that shape
     */
    readyMessage?: ((records: number) => string) | undefined;
    /**
     * How many rows have issues.
     * @defaultValue `'2 rows have issues.'`, in that shape
     */
    issuesMessage?: ((rows: number) => string) | undefined;
    /**
     * Under `'block'`, why the import waits.
     * @defaultValue `'Fix these rows in the file and choose it again to import it.'`
     */
    blockedLabel?: string | undefined;
    /**
     * Under `'exclude'`, what happens to the rows with issues.
     * @defaultValue `'They will be left out.'`
     */
    excludedLabel?: string | undefined;
    /**
     * Under `'allow'`, what happens to the rows with issues.
     * @defaultValue `'They will be passed on with their issues.'`
     */
    allowedLabel?: string | undefined;
    /**
     * Said when more rows have issues than are listed: how many more.
     * @defaultValue `'And 5 more rows.'`, in that shape
     */
    moreIssuesMessage?: ((rows: number) => string) | undefined;
    /**
     * One issue's text: its row's position from 1, the field's name (or none for the record as a whole) and the message.
     * @defaultValue `'Row 4, Email: Expected a string.'`, in that shape
     */
    issueMessage?: ((row: number, field: string | undefined, message: string) => string) | undefined;
    /**
     * The visually hidden label beside each issue's icon.
     * @defaultValue `'Issue'`
     */
    issueLabel?: string | undefined;
    /**
     * The import button, by how many records it imports.
     * @defaultValue `'Import 3 records'`, in that shape
     */
    submitMessage?: ((records: number) => string) | undefined;
    /**
     * Announced once `onSubmit` resolves.
     * @defaultValue `'Imported.'`
     */
    submittedLabel?: string | undefined;
    /**
     * Shown when `onSubmit` rejects, with its message after it.
     * @defaultValue `'The import failed.'`
     */
    submitFailedLabel?: string | undefined;
    /**
     * Shown when the table is larger than `maxRows`.
     * @defaultValue `'This table has 1200 rows; an import takes at most 1000.'`, in that shape
     */
    tooManyRowsMessage?: ((rows: number, max: number) => string) | undefined;
  }

  let {
    target,
    spec,
    table,
    onSubmit,
    invalidRows = 'block',
    maxRows,
    issueLimit = 20,
    progressMessage = (done, total) => `Mapped ${done} of ${total} rows.`,
    readyMessage = (records) =>
      records === 1 ? '1 record is ready to import.' : `${records} records are ready to import.`,
    issuesMessage = (rows) => (rows === 1 ? '1 row has issues.' : `${rows} rows have issues.`),
    blockedLabel = 'Fix these rows in the file and choose it again to import it.',
    excludedLabel = 'They will be left out.',
    allowedLabel = 'They will be passed on with their issues.',
    moreIssuesMessage = (rows) => (rows === 1 ? 'And 1 more row.' : `And ${rows} more rows.`),
    issueMessage = (row, field, message) =>
      field === undefined ? `Row ${row}: ${message}` : `Row ${row}, ${field}: ${message}`,
    issueLabel = 'Issue',
    submitMessage = (records) => (records === 1 ? 'Import 1 record' : `Import ${records} records`),
    submittedLabel = 'Imported.',
    submitFailedLabel = 'The import failed.',
    tooManyRowsMessage = (rows, max) =>
      `This table has ${rows} rows; an import takes at most ${max}.`,
    class: className,
    ...rest
  }: Props = $props();

  let mapped = $state.raw<MappedTable<S['Type']> | undefined>(undefined);
  let status = $state('');
  let error = $state<string | undefined>(undefined);
  let submitting = $state(false);
  let submitted = $state(false);
  let submitController: AbortController | undefined;

  const tooMany = $derived(maxRows !== undefined && table.rows.length > maxRows);

  const mapAll = async (total: number, signal: AbortSignal): Promise<void> => {
    try {
      const result = await mapTable(target, spec, table, {
        signal,
        onProgress: (done) => {
          status = progressMessage(done, total);
        },
      });
      if (signal.aborted) return;
      mapped = result;
      status = readyMessage(result.records.length);
    } catch (cause) {
      if (signal.aborted) return;
      status = '';
      error = cause instanceof StepError ? cause.message : String(cause);
    }
  };

  $effect(() => {
    const controller = new AbortController();
    const total = table.rows.length;
    mapped = undefined;
    submitted = false;
    error = undefined;
    if (tooMany) {
      status = '';
      error = tooManyRowsMessage(total, maxRows ?? 0);
      return () => controller.abort();
    }
    status = progressMessage(0, total);
    void mapAll(total, controller.signal);
    return () => controller.abort();
  });

  $effect(() => () => submitController?.abort());

  const titleOf = (key: string): string =>
    target.descriptor.fields.find((field) => field.key === key)?.title ?? key;

  const invalidCount = $derived(mapped?.invalid.length ?? 0);
  const blocked = $derived(invalidRows === 'block' && invalidCount > 0);
  const listed = $derived((mapped?.invalid ?? []).slice(0, issueLimit));
  const unlisted = $derived(invalidCount - listed.length);
  const policyLabels = $derived({ block: blockedLabel, exclude: excludedLabel, allow: allowedLabel });
  const policyLabel = $derived(policyLabels[invalidRows]);
  const issueLines = $derived(
    listed.flatMap((invalid) =>
      invalid.issues.map((issue, index) => ({
        key: `${invalid.row}:${index}`,
        text: issueMessage(
          invalid.row + 1,
          Option.getOrUndefined(Option.map(issue.field, titleOf)),
          issue.message,
        ),
      })),
    ),
  );
  const busy = $derived(mapped === undefined && error === undefined);
  /** The mapped rows while the import can still be submitted. */
  const ready = $derived(submitted ? undefined : mapped);

  const submit = async (): Promise<void> => {
    if (mapped === undefined || blocked) return;
    submitController?.abort();
    const controller = new AbortController();
    submitController = controller;
    submitting = true;
    error = undefined;
    const result: ImportResult<S['Type']> = {
      records: mapped.records,
      excluded: invalidRows === 'exclude' ? mapped.invalid.map((row) => row.row) : [],
      invalid: invalidRows === 'allow' ? mapped.invalid : [],
      spec,
      edits: [],
    };
    try {
      await onSubmit(result, controller.signal);
      if (controller.signal.aborted) return;
      submitted = true;
      status = submittedLabel;
    } catch (cause) {
      if (controller.signal.aborted) return;
      const detail = cause instanceof Error && cause.message !== '' ? ` ${cause.message}` : '';
      error = `${submitFailedLabel}${detail}`;
    } finally {
      if (!controller.signal.aborted) submitting = false;
    }
  };
</script>

<div {...rest} class={['flex flex-col gap-4', className]} aria-busy={busy ? 'true' : undefined}>
  <p role="status">{status}</p>

  {#if issueLines.length > 0}
    <div class="flex flex-col gap-2">
      <p>{issuesMessage(invalidCount)} {policyLabel}</p>
      <ul class="flex flex-col gap-1 text-sm">
        {#each issueLines as line (line.key)}
          <li class="flex items-start gap-2">
            <span class="text-warning" aria-hidden="true">⚠</span>
            <span class="sr-only">{issueLabel}</span>
            <span>{line.text}</span>
          </li>
        {/each}
      </ul>
      {#if unlisted > 0}
        <p class="text-sm">{moreIssuesMessage(unlisted)}</p>
      {/if}
    </div>
  {/if}

  {#if error !== undefined}
    <Alert tone="error">{error}</Alert>
  {/if}

  {#if ready !== undefined}
    <div>
      <Button tone="primary" type="button" disabled={blocked || submitting} loading={submitting} onclick={submit}>
        {submitMessage(ready.records.length)}
      </Button>
    </div>
  {/if}
</div>

/**
 * The vocabulary `ErrorSummary` shares with the form that feeds it: one entry
 * per field message, the id the entry links to, and the helper that makes the
 * id on both sides agree.
 *
 * @module
 */

/** One field message in an `ErrorSummary`, linking to the control it describes. */
export interface ErrorSummaryItem {
  /** The `id` of the control (a `FormField`'s `id`, or a `Fieldset`'s) the entry links to. */
  readonly fieldId: string;
  /** The message, as the field's own `FieldErrors` shows it. */
  readonly message: string;
}

/** Field name to its messages: the shape `EntityForm` and a SvelteKit action's `fail()` data already carry. */
export type ErrorSummaryRecord = Readonly<Record<string, readonly string[]>>;

/**
 * The control id for field `name` of the form `formId`: `formId-name`, or just
 * `name` when `formId` is empty. Give a `FormField` this as its `id` and the
 * same call in `ErrorSummary`'s `formId` prop links the summary to it.
 */
export const fieldId = (formId: string, name: string): string =>
  formId === '' ? name : `${formId}-${name}`;

/**
 * Flatten a field-name to messages record into summary entries, one per
 * message, in the record's key order.
 */
export const errorSummaryItems = (
  record: ErrorSummaryRecord,
  formId = '',
): readonly ErrorSummaryItem[] =>
  Object.entries(record).flatMap(([name, messages]) =>
    messages.map((message) => ({ fieldId: fieldId(formId, name), message })),
  );

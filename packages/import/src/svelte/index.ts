/**
 * `@thomasfosterau/components-import/svelte`: the import mapper's UI.
 *
 * `ImportMapper` is the whole flow; `ImportSource`, `ImportReadOptions`,
 * `ImportFieldMap` and `ImportSubmit` are its steps, for an app that lays
 * the flow out itself. Shipped as `.svelte` source by `svelte-package`,
 * for the consumer's compiler, on `@thomasfosterau/components` for its fields and buttons.
 *
 * @module
 */

export { default as ImportFieldMap } from './ImportFieldMap.svelte';
export { default as ImportMapper } from './ImportMapper.svelte';
export { default as ImportReadOptions } from './ImportReadOptions.svelte';
export { default as ImportSource } from './ImportSource.svelte';
export { default as ImportSubmit } from './ImportSubmit.svelte';
export {
  defaultReaderChoice,
  specFor,
  type DetectedFormat,
  type ImportDialect,
  type ImportReader,
  type ImportReaderOptions,
  type QuoteChoice,
  type ReaderChoice,
  type SeparatorChoice,
  type FieldChoice,
  type FieldChoices,
  type ImportFile,
  type ImportFormat,
  type ImportResult,
  type InvalidRow,
  type InvalidRowPolicy,
  type ServiceFreeTarget,
} from './session.ts';

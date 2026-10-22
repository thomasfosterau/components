import * as Schema from 'effect/Schema';
import { ChartSpec } from './spec.ts';

/**
 * Builds the language-neutral JSON Schema document for the portable chart
 * spec. This is the artifact shared with Swift/Kotlin — the only thing that
 * crosses a language boundary.
 *
 * Emitted as JSON Schema draft 2020-12 via Effect's `toJsonSchemaDocument`.
 * `onExcessProperty: 'error'` mirrors the decoder option `parseSpec` uses, so
 * the artifact closes every object (`additionalProperties: false`) exactly
 * where parsing rejects unknown keys; Effect's default leaves them open.
 */
export function buildJsonSchema() {
  const document = Schema.toJsonSchemaDocument(ChartSpec, { onExcessProperty: 'error' });
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://github.com/thomasfosterau/components/blob/trunk/packages/charts/schema/chart-spec.v1.json',
    ...document.schema,
    $defs: document.definitions,
  };
}

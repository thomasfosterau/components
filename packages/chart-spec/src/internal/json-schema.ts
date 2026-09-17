import { Schema } from 'effect';
import { ChartSpec } from './spec.ts';

/**
 * Builds the language-neutral JSON Schema document for the portable chart
 * spec. This is the artifact shared with Swift/Kotlin — the only thing that
 * crosses a language boundary.
 *
 * Emitted as JSON Schema draft 2020-12 via Effect's `toJsonSchemaDocument`.
 */
export function buildJsonSchema(): Record<string, unknown> {
  const document = Schema.toJsonSchemaDocument(ChartSpec);
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://github.com/thomasfosterau/charts/schema/chart-spec.v1.json',
    ...document.schema,
    $defs: document.definitions,
  };
}

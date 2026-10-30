/**
 * `@thomasfosterau/charts`
 *
 * Layer 1 of the portable chart architecture: the durable, declarative,
 * language-neutral chart specification.
 *
 * Public surface: plain TypeScript types, parse/validate/encode functions,
 * and data type guards. The Effect Schema machinery is an internal
 * implementation detail and never crosses this boundary.
 */

export {
  SPEC_VERSION,
  type SpecVersion,
  type Mark,
  type TreeOptions,
  type FieldType,
  type Channel,
  type Encoding,
  type DatumValue,
  type Datum,
  type InlineData,
  type DataRefKind,
  type DataRef,
  type Data,
  type ScaleHint,
  type Scales,
  type Config,
  type Extensions,
  type ChartSpec,
} from './types.ts';

export { isInlineData, isDataRef } from './guards.ts';

export {
  parseSpec,
  validateSpec,
  encodeSpec,
  SpecValidationError,
  type ValidationResult,
} from './parse.ts';

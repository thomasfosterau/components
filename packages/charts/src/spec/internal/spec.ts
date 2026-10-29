import * as Schema from 'effect/Schema';
import { Config } from './config.ts';
import { Data } from './data.ts';
import { Encoding } from './encoding.ts';
import { Extensions } from './extensions.ts';
import { Mark } from './mark.ts';
import { Scales } from './scales.ts';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/** The spec versions this interpreter accepts (`'1.1'` adds the `x2` / `y2` channels). */
const SpecVersion = Schema.Literals(['1', '1.1']).annotate({
  identifier: 'SpecVersion',
  description: 'The portable chart spec version this document conforms to.',
});

/**
 * The portable chart specification (Layer 1).
 *
 * The durable, declarative, language-neutral chart description. Grammar-level
 * only: marks and encodings, never geometry, pixels, or renderer names.
 */
export const ChartSpec = Schema.Struct({
  specVersion: SpecVersion,
  mark: Mark,
  encoding: Encoding,
  data: Data,
  scales: Schema.optionalKey(Scales),
  config: Schema.optionalKey(Config),
  extensions: Schema.optionalKey(Extensions),
}).annotate({
  identifier: 'ChartSpec',
  title: 'Portable Chart Specification',
  description:
    'A renderer-agnostic, framework-agnostic, language-neutral chart description. ' +
    'Grammar-of-graphics level: mark + encodings + declared data types + data reference.',
});

/** The decoded type of {@link SpecVersion}; the public mirror is `SpecVersion` in `../types.ts`. */
export type SpecVersion = typeof SpecVersion.Type;

/** The decoded type of {@link ChartSpec}; the public mirror is `ChartSpec` in `../types.ts`. */
export type ChartSpec = typeof ChartSpec.Type;

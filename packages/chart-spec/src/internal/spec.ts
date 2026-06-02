import { Schema } from 'effect';
import { Config } from './config.ts';
import { Data } from './data.ts';
import { Encoding } from './encoding.ts';
import { Extensions } from './extensions.ts';
import { Mark } from './mark.ts';
import { Scales } from './scales.ts';

/** The spec version literal accepted by v1 interpreters. */
export const SpecVersion = Schema.Literal('1').annotate({
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

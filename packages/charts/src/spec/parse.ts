import * as Arr from 'effect/Array';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import { ChartSpec as ChartSpecSchema } from './internal/spec.ts';
import type { ChartSpec } from './types.ts';

/**
 * The Effect isolation boundary.
 *
 * Effect v4 Schema is a beta surface; it is used only inside this package.
 * Consumers get plain functions, plain types, and plain errors — nothing
 * Effect-flavoured crosses the package boundary.
 */

/**
 * Strict parse options, matching the emitted JSON Schema
 * (`additionalProperties: false`): unknown keys are rejected, and all
 * errors are collected so validation messages are complete.
 */
const parseOptions = { onExcessProperty: 'error', errors: 'all' } as const;

const decodeChartSpec = Schema.decodeUnknownResult(ChartSpecSchema, parseOptions);
const encode = Schema.encodeUnknownSync(ChartSpecSchema, parseOptions);

/** A range channel and the start channel it pairs with. */
const RANGE_PAIRS = [
  ['x2', 'x'],
  ['y2', 'y'],
] as const;

/** The errors of one range channel, `end`, against its start channel. */
function rangePairErrors(
  spec: ChartSpec,
  end: 'x2' | 'y2',
  start: 'x' | 'y',
): ReadonlyArray<string> {
  const channel = spec.encoding[end];
  if (channel === undefined) return [];
  const startChannel = spec.encoding[start];
  const at = `["encoding"]["${end}"]`;
  return Arr.getSomes([
    spec.specVersion === '1'
      ? Option.some(`${at}: range channels need specVersion "1.1"`)
      : Option.none(),
    spec.mark === 'bar'
      ? Option.none()
      : Option.some(`${at}: range channels are only valid with mark "bar"`),
    startChannel === undefined
      ? Option.some(`${at}: needs "${start}" as the start of the range`)
      : startChannel.type === channel.type
        ? Option.none()
        : Option.some(`${at}: type must match "${start}" (${startChannel.type})`),
    channel.type === 'quantitative' || channel.type === 'temporal'
      ? Option.none()
      : Option.some(`${at}: must be quantitative or temporal`),
  ]);
}

/**
 * The cross-field rules the schema cannot express (and the JSON Schema
 * therefore does not carry): a range channel (`x2` / `y2`) needs spec
 * version `'1.1'`, `mark: 'bar'`, and its start channel with the same
 * `quantitative` or `temporal` type.
 */
function rangeErrors(spec: ChartSpec): ReadonlyArray<string> {
  return Arr.flatMap(RANGE_PAIRS, ([end, start]) => rangePairErrors(spec, end, start));
}

function decode(input: unknown): ValidationResult {
  return Result.match(decodeChartSpec(input), {
    onSuccess: (value): ValidationResult =>
      Arr.match(rangeErrors(value), {
        onEmpty: (): ValidationResult => ({ ok: true, value }),
        onNonEmpty: (errors): ValidationResult => ({ ok: false, errors }),
      }),
    onFailure: (error): ValidationResult => ({ ok: false, errors: [error.message] }),
  });
}

/** Thrown when a value is not a valid portable chart spec. */
export class SpecValidationError extends Error {
  override readonly name = 'SpecValidationError';

  constructor(message: string) {
    super(message);
  }
}

/** The result of {@link validateSpec}. */
export type ValidationResult =
  | { readonly ok: true; readonly value: ChartSpec }
  | { readonly ok: false; readonly errors: ReadonlyArray<string> };

/**
 * Parses an unknown JSON value into a {@link ChartSpec}.
 *
 * @throws {SpecValidationError} when the value is not a valid spec.
 */
export function parseSpec(input: unknown): ChartSpec {
  const result = decode(input);
  if (!result.ok) throw new SpecValidationError(result.errors.join('\n'));
  return result.value;
}

/**
 * Validates an unknown JSON value against the portable chart spec,
 * returning a result instead of throwing.
 */
export function validateSpec(input: unknown): ValidationResult {
  return decode(input);
}

/**
 * Encodes a {@link ChartSpec} back to a plain JSON-safe value, suitable for
 * persisting (e.g. into ProseMirror node attrs).
 */
export function encodeSpec(spec: ChartSpec): unknown {
  return encode(spec);
}

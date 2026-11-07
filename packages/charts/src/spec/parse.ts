import * as Arr from 'effect/Array';
import * as Option from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import { Mark as MarkSchema } from './internal/mark.ts';
import {
  ChartSpec as ChartSpecSchema,
  UnsupportedMarkSpec as UnsupportedMarkSpecSchema,
} from './internal/spec.ts';
import type { SpecDegradation, UnsupportedMark, ValidationResult } from './result.ts';
import { SPEC_VERSION, type ChartSpec } from './types.ts';

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

/**
 * Degrading parse options, for a newer `1.N` document only: unknown keys
 * are stripped (and reported as `ignored`) instead of rejected. The JSON
 * Schema stays strict; only the parsers degrade.
 */
const degradeOptions = { onExcessProperty: 'ignore', errors: 'all' } as const;

const decodeDegraded = Schema.decodeUnknownResult(ChartSpecSchema, degradeOptions);
const decodeUnsupported = Schema.decodeUnknownResult(UnsupportedMarkSpecSchema, degradeOptions);
const isKnownMark = Schema.is(MarkSchema);

/** The newest minor of major version 1 this interpreter knows (`SPEC_VERSION`, `'1.1'`). */
const NEWEST_KNOWN_MINOR = 1;

/** A `1.N` version string: no leading zeros, no suffix. */
const MINOR_VERSION = /^1\.(0|[1-9]\d*)$/;

/** Whether `version` is a `1.N` newer than every version this interpreter knows. */
function isNewerMinor(version: string): boolean {
  const match = MINOR_VERSION.exec(version);
  return match !== null && Number(match[1]) > NEWEST_KNOWN_MINOR;
}

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

/** The channels only the `tree` mark takes, and the positional ones it does not. */
const TREE_CHANNELS = ['id', 'parent', 'label'] as const;
const POSITIONAL_CHANNELS = ['x', 'y', 'x2', 'y2'] as const;

/**
 * The `tree` mark's rules (spec 1.1): it needs `'1.1'` and `id` + `parent`,
 * takes no positional channel (position is laid out, not encoded), and its
 * channels and `tree` options are invalid on any other mark. The row-level
 * rules (unique ids, known parents, no cycles) need the rows, so the core
 * checks them when it lays the tree out.
 */
function treeErrors(spec: ChartSpec): ReadonlyArray<string> {
  const present = (names: ReadonlyArray<keyof ChartSpec['encoding']>) =>
    Arr.filter(names, (name) => spec.encoding[name] !== undefined);
  if (spec.mark !== 'tree') {
    return Arr.appendAll(
      Arr.map(
        present(TREE_CHANNELS),
        (name) => `["encoding"]["${name}"]: only valid with mark "tree"`,
      ),
      spec.tree === undefined ? [] : ['["tree"]: only valid with mark "tree"'],
    );
  }
  return Arr.getSomes([
    spec.specVersion === '1'
      ? Option.some('["mark"]: "tree" needs specVersion "1.1"')
      : Option.none(),
    spec.encoding.id === undefined
      ? Option.some('["encoding"]["id"]: mark "tree" needs an id channel')
      : Option.none(),
    spec.encoding.parent === undefined
      ? Option.some('["encoding"]["parent"]: mark "tree" needs a parent channel')
      : Option.none(),
    ...Arr.map(present(POSITIONAL_CHANNELS), (name) =>
      Option.some(`["encoding"]["${name}"]: mark "tree" lays out position; it takes no "${name}"`),
    ),
  ]);
}

/** The cross-field errors of a decoded spec. */
function crossFieldErrors(value: ChartSpec): ReadonlyArray<string> {
  return Arr.appendAll(rangeErrors(value), treeErrors(value));
}

/** A failed result from a decode error. */
function failure(error: { readonly message: string }): ValidationResult {
  return { ok: false, errors: [error.message] };
}

/**
 * The paths of the keys of `input` that `output` dropped, in the error
 * messages' `["a"]["b"]` form. Arrays are not walked: the only objects in
 * them are data rows, which are records and keep every key.
 */
function droppedPaths(input: unknown, output: unknown, at: string): ReadonlyArray<string> {
  if (!P.isObject(input) || !P.isObject(output) || Array.isArray(input)) return [];
  return Arr.flatMap(R.keys(input), (key) => {
    const path = `${at}["${key}"]`;
    return key in output ? droppedPaths(input[key], output[key], path) : [path];
  });
}

/** The value at `key` of a JSON object, or `undefined` for anything else. */
function fieldOf(input: unknown, key: string): unknown {
  return P.isObject(input) && !Array.isArray(input) ? input[key] : undefined;
}

/** The declared `specVersion` when it is a `1.N` newer than every version this interpreter knows. */
function newerMinorOf(input: unknown): Option.Option<string> {
  const version = fieldOf(input, 'specVersion');
  return P.isString(version) && isNewerMinor(version) ? Option.some(version) : Option.none();
}

/**
 * Parses a newer `1.N` document as the newest version this interpreter
 * knows: unknown keys are stripped and reported, the version is normalised
 * to `SPEC_VERSION`, and an unknown mark becomes a failed result carrying
 * the `unsupported` spec, for the data-table fallback.
 */
function decodeNewerMinor(input: unknown, declaredVersion: string): ValidationResult {
  const candidate = P.isObject(input) ? { ...input, specVersion: SPEC_VERSION } : input;
  const degradation = (output: unknown): SpecDegradation => ({
    declaredVersion,
    ignored: droppedPaths(candidate, output, ''),
  });
  const mark = fieldOf(input, 'mark');
  if (P.isString(mark) && !isKnownMark(mark)) {
    return Result.match(decodeUnsupported(candidate), {
      onSuccess: (spec): ValidationResult => ({
        ok: false,
        errors: [
          `["mark"]: "${mark}" is not a mark this interpreter knows (the spec declares specVersion "${declaredVersion}")`,
        ],
        unsupported: { spec, degradation: degradation(spec) },
      }),
      onFailure: failure,
    });
  }
  return Result.match(decodeDegraded(candidate), {
    onSuccess: (value): ValidationResult =>
      Arr.match(crossFieldErrors(value), {
        onEmpty: (): ValidationResult => ({ ok: true, value, degradation: degradation(value) }),
        onNonEmpty: (errors): ValidationResult => ({ ok: false, errors }),
      }),
    onFailure: failure,
  });
}

/** The strict parse of a `'1'` or `'1.1'` document (and the rejection of anything else). */
function decodeStrict(input: unknown): ValidationResult {
  return Result.match(decodeChartSpec(input), {
    onSuccess: (value): ValidationResult =>
      Arr.match(crossFieldErrors(value), {
        onEmpty: (): ValidationResult => ({ ok: true, value }),
        onNonEmpty: (errors): ValidationResult => ({ ok: false, errors }),
      }),
    onFailure: failure,
  });
}

function decode(input: unknown): ValidationResult {
  return Option.match(newerMinorOf(input), {
    onNone: () => decodeStrict(input),
    onSome: (version) => decodeNewerMinor(input, version),
  });
}

export type { SpecDegradation, UnsupportedMark, ValidationResult } from './result.ts';

/** Thrown when a value is not a valid portable chart spec. */
export class SpecValidationError extends Error {
  override readonly name: string = 'SpecValidationError';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown by {@link parseSpec} for a newer `1.N` document whose mark this
 * interpreter does not know. It is a {@link SpecValidationError}, so a
 * caller that only catches that one keeps working; `unsupported` carries
 * the spec for the data-table fallback.
 */
export class UnsupportedMarkError extends SpecValidationError {
  override readonly name: string = 'UnsupportedMarkError';
  /** The document's known fields and what the degrading parse dropped. */
  readonly unsupported: UnsupportedMark;

  constructor(message: string, unsupported: UnsupportedMark) {
    super(message);
    this.unsupported = unsupported;
  }
}

/**
 * Parses an unknown JSON value into a {@link ChartSpec}. A newer `1.N`
 * document is read as the newest version this interpreter knows, its
 * unknown keys ignored; use {@link validateSpec} to learn which.
 *
 * @throws {UnsupportedMarkError} when the value is a newer `1.N` document whose mark is unknown.
 * @throws {SpecValidationError} when the value is not a valid spec.
 */
export function parseSpec(input: unknown): ChartSpec {
  const result = decode(input);
  if (result.ok) return result.value;
  const message = result.errors.join('\n');
  throw result.unsupported === undefined
    ? new SpecValidationError(message)
    : new UnsupportedMarkError(message, result.unsupported);
}

/**
 * Validates an unknown JSON value against the portable chart spec,
 * returning a result instead of throwing. `'1'` and `'1.1'` documents are
 * read strictly; a newer `1.N` one degrades (see {@link ValidationResult}).
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

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

const decode = Schema.decodeUnknownResult(ChartSpecSchema, parseOptions);
const encode = Schema.encodeUnknownSync(ChartSpecSchema, parseOptions);

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
  return Result.getOrThrowWith(decode(input), (error) => new SpecValidationError(error.message));
}

/**
 * Validates an unknown JSON value against the portable chart spec,
 * returning a result instead of throwing.
 */
export function validateSpec(input: unknown): ValidationResult {
  return Result.match(decode(input), {
    onSuccess: (value): ValidationResult => ({ ok: true, value }),
    onFailure: (error): ValidationResult => ({ ok: false, errors: [error.message] }),
  });
}

/**
 * Encodes a {@link ChartSpec} back to a plain JSON-safe value, suitable for
 * persisting (e.g. into ProseMirror node attrs).
 */
export function encodeSpec(spec: ChartSpec): unknown {
  return encode(spec);
}

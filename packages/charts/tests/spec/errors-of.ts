/**
 * The errors of a failed `validateSpec`, failing the test when it passed, so
 * an assertion on them always runs.
 */
import type { ValidationResult } from '../../src/spec/index.ts';

/** The error messages of `result`, which must be a failure. */
export function errorsOf(result: ValidationResult): ReadonlyArray<string> {
  if (result.ok) throw new Error('expected validation errors, got a valid spec');
  return result.errors;
}

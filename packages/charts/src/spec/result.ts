/**
 * The results of `validateSpec`: plain, Effect-free types (the parse
 * itself is in `parse.ts`). Unlike the JSON-document types in `types.ts`,
 * these are values the parser builds, so their optional members are
 * `T | undefined`, the workspace rule.
 */
import type { ChartSpec, UnsupportedMarkSpec } from './types.ts';

/**
 * How a newer `1.N` document was read: the version it declared, and the
 * keys this interpreter did not know and ignored, each as a path in the
 * error messages' form (`["encoding"]["shape"]`), in document order.
 */
export interface SpecDegradation {
  /** The `specVersion` the document declared, e.g. `'1.2'`. */
  readonly declaredVersion: string;
  /** The paths of the keys that were ignored; empty when every key was known. */
  readonly ignored: ReadonlyArray<string>;
}

/** A newer `1.N` document with a mark this interpreter does not know. */
export interface UnsupportedMark {
  /** The document's known fields, `mark` as written. */
  readonly spec: UnsupportedMarkSpec;
  /** The version it declared and the keys that were ignored (a `tree` key among them). */
  readonly degradation: SpecDegradation;
}

/**
 * The result of `validateSpec`. A newer `1.N` document that parsed
 * is `ok` with a `degradation`; one whose mark is unknown fails, with an
 * error naming the mark, and carries `unsupported`. Both fields are absent
 * for a `'1'` or `'1.1'` document.
 */
export type ValidationResult =
  | {
      readonly ok: true;
      readonly value: ChartSpec;
      /** Present when the document declared a newer `1.N`: what was ignored to read it. */
      readonly degradation?: SpecDegradation | undefined;
    }
  | {
      readonly ok: false;
      readonly errors: ReadonlyArray<string>;
      /** Present when the only problem is a newer `1.N` mark this interpreter does not know. */
      readonly unsupported?: UnsupportedMark | undefined;
    };

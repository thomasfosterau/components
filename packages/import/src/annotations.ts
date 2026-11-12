/**
 * The `importAliases` schema annotation, declared on Effect's annotation
 * interface so `Schema.String.annotate({ importAliases: [...] })` type-checks.
 *
 * @module
 */

/**
 * Other names a source column may carry for a field, matched when the mapper
 * suggests a column for it: `["email", "e-mail", "mail"]`. Set it with
 * `.annotate({ importAliases })` on the field's schema; `importTarget` copies
 * it into the field's descriptor.
 */
export type ImportAliases = ReadonlyArray<string>;

declare module 'effect/Schema' {
  namespace Annotations {
    interface Annotations {
      /** Other names a source column may carry for this field ({@link ImportAliases}). */
      readonly importAliases?: ImportAliases;
    }
  }
}

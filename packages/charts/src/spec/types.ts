/**
 * Public, dependency-free TypeScript types for the portable chart specification.
 *
 * These are hand-authored mirrors of the Effect Schema definitions in
 * `internal/`. They are the only types consumers see — no Effect types leak
 * through the package boundary. A type-parity test asserts these stay
 * structurally identical to the schema-derived types.
 *
 * Design invariants (see the README § Capability matrix):
 * - Grammar-level only: marks and encodings, never geometry, pixels, or
 *   renderer names.
 * - Every encoding channel carries an explicit `type`; interpreters
 *   reconstruct typed values from declared types, never by sniffing JSON.
 * - The portable subset targets the intersection of native charting
 *   vocabularies (Swift Charts, Compose). Web-only richness goes in
 *   `extensions` and degrades gracefully.
 * - Optional members are bare `prop?: T`, the one exception to the
 *   workspace's `T | undefined` rule: these types describe a JSON document,
 *   where a key is present with a value or absent and `undefined` does not
 *   exist. The schemas say the same (`Schema.optionalKey`), so `parseSpec`
 *   rejects a present-but-undefined key, and widening either side would make
 *   the emitted JSON Schema admit `null`.
 */

/** The current portable chart spec version; what a new spec should declare. */
export const SPEC_VERSION = '1.1';

/**
 * The spec versions this interpreter accepts. `'1.1'` adds the `x2` / `y2`
 * range channels; every `'1'` spec is a valid `'1.1'` spec. See the README
 * § Versioning for the minor-version degradation rule.
 */
export type SpecVersion = '1' | '1.1';

/**
 * The mark (geometric primitive) used to render the chart.
 *
 * Restricted to the intersection of the native charting vocabularies
 * (Swift Charts BarMark/LineMark/PointMark/AreaMark and their Compose
 * equivalents).
 */
export type Mark = 'bar' | 'line' | 'point' | 'area';

/**
 * The declared type of an encoded field.
 *
 * - `quantitative` — continuous numeric values
 * - `temporal` — points in time, encoded as ISO 8601 strings or epoch milliseconds
 * - `ordinal` — discrete, ordered categories
 * - `nominal` — discrete, unordered categories
 */
export type FieldType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';

/** A mapping from a data field to a visual channel, with an explicit type. */
export interface Channel {
  /** The name of the field in each datum that this channel reads. */
  readonly field: string;
  /** The declared type of the field. Interpreters must respect this, never sniff values. */
  readonly type: FieldType;
}

/** Field-to-channel mappings. At minimum, `x` and `y` are expected for all v1 marks. */
export interface Encoding {
  readonly x?: Channel;
  readonly y?: Channel;
  /**
   * The end of a range on the x axis (spec 1.1): with `mark: 'bar'`, each
   * bar spans `x` to `x2`, a range bar (a Gantt row). Same `type` as `x`,
   * `quantitative` or `temporal`.
   */
  readonly x2?: Channel;
  /** The end of a range on the y axis (spec 1.1), as `x2` is for x. */
  readonly y2?: Channel;
  readonly color?: Channel;
  readonly size?: Channel;
  readonly opacity?: Channel;
}

/** A single value inside a datum. Inline data rows are flat records of JSON primitives. */
export type DatumValue = string | number | boolean | null;

/** A single data row. */
export type Datum = { readonly [field: string]: DatumValue };

/** Inline data: small datasets embedded directly in the spec. */
export interface InlineData {
  readonly values: ReadonlyArray<Datum>;
}

/**
 * The kind of an external data reference.
 *
 * - `query` — a live query (e.g. a Durable Object or database query) known to the host
 * - `node` — another content node in the host document store
 * - `url` — an addressable resource returning JSON rows
 */
export type DataRefKind = 'query' | 'node' | 'url';

/** A reference to an externally stored dataset, resolved by the host/interpreter. */
export interface DataRef {
  readonly ref: {
    readonly kind: DataRefKind;
    readonly id: string;
  };
}

/** The chart's data: exactly one of inline values or an external reference. */
export type Data = InlineData | DataRef;

/**
 * Optional per-scale hints. Interpreters may infer or override these;
 * they are hints, not geometry.
 */
export interface ScaleHint {
  /**
   * Explicit domain. Numbers for quantitative, ISO strings for temporal,
   * category values for ordinal/nominal.
   */
  readonly domain?: ReadonlyArray<number | string>;
  /** Round the domain to human-friendly values. */
  readonly nice?: boolean;
  /** Force the domain to include zero. */
  readonly zero?: boolean;
}

/** Per-channel scale hints. */
export interface Scales {
  readonly x?: ScaleHint;
  readonly y?: ScaleHint;
}

/** Portable presentation hints honoured (or gracefully ignored) by every interpreter. */
export interface Config {
  readonly title?: string;
  /** Whether tooltips are enabled. A trivial declarative hint — real interaction is per-platform. */
  readonly tooltip?: boolean;
}

/**
 * Web-only, non-portable hints (e.g. preferred renderer, interaction
 * descriptors). Native interpreters ignore this entirely.
 */
export type Extensions = { readonly [key: string]: unknown };

/**
 * The portable chart specification (Layer 1).
 *
 * This is the durable, cross-platform contract. It is pure JSON,
 * grammar-level, and versioned. Everything else — geometry cores, framework
 * components, renderers — is a per-platform interpreter of this spec.
 */
export interface ChartSpec {
  readonly specVersion: SpecVersion;
  readonly mark: Mark;
  readonly encoding: Encoding;
  readonly data: Data;
  readonly scales?: Scales;
  readonly config?: Config;
  readonly extensions?: Extensions;
}

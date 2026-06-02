/**
 * The subset of Vega-Lite's specification shape that the emitter produces.
 *
 * Deliberately structural (not imported from the vega-lite package) so this
 * package stays dependency-light; the test suite validates emitted specs
 * against the real Vega-Lite compiler.
 */

/** A Vega-Lite field definition for a positional or mark-property channel. */
export interface VegaLiteFieldDef {
  readonly field: string;
  readonly type: 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
  readonly scale?: {
    readonly domain?: ReadonlyArray<number | string>;
    readonly nice?: boolean;
    readonly zero?: boolean;
  };
}

/** The Vega-Lite encoding block. */
export interface VegaLiteEncoding {
  readonly x?: VegaLiteFieldDef;
  readonly y?: VegaLiteFieldDef;
  readonly color?: VegaLiteFieldDef;
  readonly size?: VegaLiteFieldDef;
  readonly opacity?: VegaLiteFieldDef;
}

/** The Vega-Lite data block. */
export type VegaLiteData =
  | { readonly values: ReadonlyArray<Record<string, unknown>> }
  | { readonly url: string };

/** A single-view Vega-Lite specification. */
export interface VegaLiteSpec {
  readonly $schema: string;
  readonly title?: string;
  readonly mark: { readonly type: 'bar' | 'line' | 'point' | 'area'; readonly tooltip?: boolean };
  readonly data: VegaLiteData;
  readonly encoding: VegaLiteEncoding;
  readonly width?: number | 'container';
  readonly height?: number;
}

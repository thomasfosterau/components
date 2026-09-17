/**
 * Compile-time parity between the public, Effect-free mirror types
 * (src/types.ts) and the Effect Schema-derived types (src/internal/).
 *
 * If the schema and the mirror types drift apart, this file fails to
 * typecheck — keeping the public surface honest without leaking Effect
 * types into the published .d.ts.
 */
import { describe, expect, it } from 'vitest';
import type { Config } from '../src/internal/config.ts';
import type { Data, DataRef, Datum, InlineData } from '../src/internal/data.ts';
import type { Channel, Encoding, FieldType } from '../src/internal/encoding.ts';
import type { Mark } from '../src/internal/mark.ts';
import type { ScaleHint, Scales } from '../src/internal/scales.ts';
import type { ChartSpec } from '../src/internal/spec.ts';
import type * as Public from '../src/types.ts';

/** Mutual assignability in both directions. */
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type Assert<T extends true> = T;

// Schema-derived types
type SchemaMark = (typeof Mark)['Type'];
type SchemaFieldType = (typeof FieldType)['Type'];
type SchemaChannel = (typeof Channel)['Type'];
type SchemaEncoding = (typeof Encoding)['Type'];
type SchemaDatum = (typeof Datum)['Type'];
type SchemaInlineData = (typeof InlineData)['Type'];
type SchemaDataRef = (typeof DataRef)['Type'];
type SchemaData = (typeof Data)['Type'];
type SchemaScaleHint = (typeof ScaleHint)['Type'];
type SchemaScales = (typeof Scales)['Type'];
type SchemaConfig = (typeof Config)['Type'];
type SchemaChartSpec = (typeof ChartSpec)['Type'];

// Parity assertions (compile-time only)
type _MarkParity = Assert<Equals<Public.Mark, SchemaMark>>;
type _FieldTypeParity = Assert<Equals<Public.FieldType, SchemaFieldType>>;
type _ChannelParity = Assert<Equals<Public.Channel, SchemaChannel>>;
type _EncodingParity = Assert<Equals<Public.Encoding, SchemaEncoding>>;
type _DatumParity = Assert<Equals<Public.Datum, SchemaDatum>>;
type _InlineDataParity = Assert<Equals<Public.InlineData, SchemaInlineData>>;
type _DataRefParity = Assert<Equals<Public.DataRef, SchemaDataRef>>;
type _DataParity = Assert<Equals<Public.Data, SchemaData>>;
type _ScaleHintParity = Assert<Equals<Public.ScaleHint, SchemaScaleHint>>;
type _ScalesParity = Assert<Equals<Public.Scales, SchemaScales>>;
type _ConfigParity = Assert<Equals<Public.Config, SchemaConfig>>;
type _ChartSpecParity = Assert<Equals<Public.ChartSpec, SchemaChartSpec>>;

describe('type parity', () => {
  it('public mirror types are structurally identical to schema types (compile-time)', () => {
    // The assertions above are the real test; this keeps vitest happy.
    const witnesses: [
      _MarkParity,
      _FieldTypeParity,
      _ChannelParity,
      _EncodingParity,
      _DatumParity,
      _InlineDataParity,
      _DataRefParity,
      _DataParity,
      _ScaleHintParity,
      _ScalesParity,
      _ConfigParity,
      _ChartSpecParity,
    ] = [true, true, true, true, true, true, true, true, true, true, true, true];
    expect(witnesses.every(Boolean)).toBe(true);
  });
});

/**
 * Compile-time parity between the public, Effect-free mirror types
 * (src/spec/types.ts) and the Effect Schema-derived types (src/spec/internal/).
 *
 * If the schema and the mirror types drift apart, this file fails to
 * typecheck — keeping the public surface honest without leaking Effect
 * types into the published .d.ts.
 */
import { describe, expect, it } from 'vite-plus/test';
import type { Config as SchemaConfig } from '../../src/spec/internal/config.ts';
import type {
  DatumValue as SchemaDatumValue,
  Datum as SchemaDatum,
  InlineData as SchemaInlineData,
  DataRefKind as SchemaDataRefKind,
  DataRef as SchemaDataRef,
  Data as SchemaData,
} from '../../src/spec/internal/data.ts';
import type {
  FieldType as SchemaFieldType,
  Channel as SchemaChannel,
  Encoding as SchemaEncoding,
} from '../../src/spec/internal/encoding.ts';
import type { Extensions as SchemaExtensions } from '../../src/spec/internal/extensions.ts';
import type {
  Mark as SchemaMark,
  TreeOptions as SchemaTreeOptions,
} from '../../src/spec/internal/mark.ts';
import type {
  ScaleHint as SchemaScaleHint,
  Scales as SchemaScales,
} from '../../src/spec/internal/scales.ts';
import type {
  SpecVersion as SchemaSpecVersion,
  ChartSpec as SchemaChartSpec,
} from '../../src/spec/internal/spec.ts';
import type * as Public from '../../src/spec/types.ts';

/** Mutual assignability in both directions. */
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type Assert<T extends true> = T;

// Parity assertions (compile-time only), against each schema's `typeof X.Type` alias.
type _MarkParity = Assert<Equals<Public.Mark, SchemaMark>>;
type _TreeOptionsParity = Assert<Equals<Public.TreeOptions, SchemaTreeOptions>>;
type _FieldTypeParity = Assert<Equals<Public.FieldType, SchemaFieldType>>;
type _ChannelParity = Assert<Equals<Public.Channel, SchemaChannel>>;
type _EncodingParity = Assert<Equals<Public.Encoding, SchemaEncoding>>;
type _DatumValueParity = Assert<Equals<Public.DatumValue, SchemaDatumValue>>;
type _DatumParity = Assert<Equals<Public.Datum, SchemaDatum>>;
type _InlineDataParity = Assert<Equals<Public.InlineData, SchemaInlineData>>;
type _DataRefKindParity = Assert<Equals<Public.DataRefKind, SchemaDataRefKind>>;
type _DataRefParity = Assert<Equals<Public.DataRef, SchemaDataRef>>;
type _DataParity = Assert<Equals<Public.Data, SchemaData>>;
type _ScaleHintParity = Assert<Equals<Public.ScaleHint, SchemaScaleHint>>;
type _ScalesParity = Assert<Equals<Public.Scales, SchemaScales>>;
type _ConfigParity = Assert<Equals<Public.Config, SchemaConfig>>;
type _ExtensionsParity = Assert<Equals<Public.Extensions, SchemaExtensions>>;
type _SpecVersionParity = Assert<Equals<Public.SpecVersion, SchemaSpecVersion>>;
type _ChartSpecParity = Assert<Equals<Public.ChartSpec, SchemaChartSpec>>;

describe('type parity', () => {
  it('public mirror types are structurally identical to schema types (compile-time)', () => {
    // The assertions above are the real test; this keeps vitest happy.
    const witnesses: [
      _MarkParity,
      _TreeOptionsParity,
      _FieldTypeParity,
      _ChannelParity,
      _EncodingParity,
      _DatumValueParity,
      _DatumParity,
      _InlineDataParity,
      _DataRefKindParity,
      _DataRefParity,
      _DataParity,
      _ScaleHintParity,
      _ScalesParity,
      _ConfigParity,
      _ExtensionsParity,
      _SpecVersionParity,
      _ChartSpecParity,
    ] = [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ];
    expect(witnesses.every(Boolean)).toBe(true);
  });
});

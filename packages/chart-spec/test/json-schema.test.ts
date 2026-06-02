import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildJsonSchema } from '../src/internal/json-schema.ts';

const here = dirname(fileURLToPath(import.meta.url));
const artifactPath = resolve(here, '../../../schema/chart-spec.v1.json');

type JsonSchema = {
  $ref?: string;
  $defs: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

const emitted = buildJsonSchema() as JsonSchema;

describe('JSON Schema artifact', () => {
  it('committed artifact is in sync with the schema source (run `npm run emit-schema` if this fails)', () => {
    const committed = JSON.parse(readFileSync(artifactPath, 'utf8')) as unknown;
    expect(committed).toEqual(emitted);
  });

  it('declares JSON Schema draft 2020-12', () => {
    expect(emitted.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
  });

  it('roots at the ChartSpec definition', () => {
    expect(emitted.$ref).toBe('#/$defs/ChartSpec');
    expect(emitted.$defs['ChartSpec']).toBeDefined();
  });

  it('requires specVersion, mark, encoding, and data', () => {
    const chartSpec = emitted.$defs['ChartSpec'] as { required: string[] };
    expect(chartSpec.required).toEqual(['specVersion', 'mark', 'encoding', 'data']);
  });

  it('rejects unknown top-level properties', () => {
    const chartSpec = emitted.$defs['ChartSpec'] as { additionalProperties: boolean };
    expect(chartSpec.additionalProperties).toBe(false);
  });

  describe('discriminated union emission (the handover §10 verification)', () => {
    // Swift Codable / kotlinx.serialization codegen needs the data union to be
    // an unambiguous oneOf whose branches are distinguishable by required keys.
    it('data emits as a clean oneOf of $refs', () => {
      const data = emitted.$defs['Data'] as { oneOf: Array<{ $ref: string }> };
      expect(data.oneOf).toEqual([{ $ref: '#/$defs/InlineData' }, { $ref: '#/$defs/DataRef' }]);
    });

    it('the InlineData branch requires `values`', () => {
      const inline = emitted.$defs['InlineData'] as { required: string[] };
      expect(inline.required).toEqual(['values']);
    });

    it('the DataRef branch requires `ref`', () => {
      const ref = emitted.$defs['DataRef'] as { required: string[] };
      expect(ref.required).toEqual(['ref']);
    });
  });

  describe('cross-language friendliness', () => {
    it('mark and field type are plain string enums', () => {
      expect(emitted.$defs['Mark']).toMatchObject({
        type: 'string',
        enum: ['bar', 'line', 'point', 'area'],
      });
      expect(emitted.$defs['FieldType']).toMatchObject({
        type: 'string',
        enum: ['quantitative', 'ordinal', 'nominal', 'temporal'],
      });
    });

    it('datum values are plain JSON primitives (no NaN/Infinity encodings)', () => {
      expect(emitted.$defs['DatumValue']).toMatchObject({
        anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }],
      });
    });

    it('every definition the spec references exists in $defs', () => {
      const json = JSON.stringify(emitted);
      const refs = [...json.matchAll(/"\$ref":"#\/\$defs\/([^"]+)"/g)].map((m) => m[1]);
      for (const ref of refs) {
        expect(emitted.$defs[ref as string], `missing $defs entry: ${ref}`).toBeDefined();
      }
    });

    it('contains no geometry, pixel, or renderer concepts (grammar-level invariant)', () => {
      const json = JSON.stringify(emitted).toLowerCase();
      for (const forbidden of ['pixel', 'svg', 'canvas', 'webgl', 'webgpu', '"path"', 'viewbox']) {
        expect(json).not.toContain(forbidden);
      }
    });
  });
});

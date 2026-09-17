import { describe, expect, it } from 'vitest';
import {
  encodeSpec,
  parseSpec,
  SpecValidationError,
  validateSpec,
  type ChartSpec,
} from '../src/index.ts';

const validSpec = {
  specVersion: '1',
  mark: 'line',
  encoding: {
    x: { field: 'date', type: 'temporal' },
    y: { field: 'price', type: 'quantitative' },
  },
  data: {
    values: [
      { date: '2024-01-01', price: 150 },
      { date: '2024-01-02', price: 155.5 },
    ],
  },
  config: { title: 'Stock price', tooltip: true },
};

describe('parseSpec', () => {
  it('parses a valid spec', () => {
    const spec = parseSpec(validSpec);
    expect(spec.specVersion).toBe('1');
    expect(spec.mark).toBe('line');
    expect(spec.encoding.x).toEqual({ field: 'date', type: 'temporal' });
    expect(spec.encoding.y).toEqual({ field: 'price', type: 'quantitative' });
  });

  it('parses a spec with a data ref', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'count', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales-by-region' } },
    });
    expect(spec.data).toEqual({ ref: { kind: 'query', id: 'sales-by-region' } });
  });

  it('parses scale hints and extensions', () => {
    const spec = parseSpec({
      ...validSpec,
      scales: { y: { zero: true, nice: true, domain: [0, 200] } },
      extensions: { preferredRenderer: 'canvas' },
    });
    expect(spec.scales?.y).toEqual({ zero: true, nice: true, domain: [0, 200] });
    expect(spec.extensions).toEqual({ preferredRenderer: 'canvas' });
  });

  it('rejects an unknown mark', () => {
    expect(() => parseSpec({ ...validSpec, mark: 'donut' })).toThrow(SpecValidationError);
  });

  it('rejects a missing encoding type', () => {
    expect(() =>
      parseSpec({
        ...validSpec,
        encoding: { x: { field: 'date' } },
      }),
    ).toThrow(SpecValidationError);
  });

  it('rejects an unknown spec version', () => {
    expect(() => parseSpec({ ...validSpec, specVersion: '2' })).toThrow(SpecValidationError);
  });

  it('rejects unknown top-level keys (matches additionalProperties: false)', () => {
    expect(() => parseSpec({ ...validSpec, bogus: true })).toThrow(SpecValidationError);
  });

  it('rejects non-finite numbers in inline data', () => {
    expect(() =>
      parseSpec({
        ...validSpec,
        data: { values: [{ date: '2024-01-01', price: Number.NaN }] },
      }),
    ).toThrow(SpecValidationError);
  });

  it('rejects nested objects in inline data rows (rows are flat primitives)', () => {
    expect(() =>
      parseSpec({
        ...validSpec,
        data: { values: [{ date: '2024-01-01', price: { amount: 150 } }] },
      }),
    ).toThrow(SpecValidationError);
  });

  it('rejects data that is neither values nor ref', () => {
    expect(() => parseSpec({ ...validSpec, data: {} })).toThrow(SpecValidationError);
  });

  it('rejects non-object input', () => {
    expect(() => parseSpec('not a spec')).toThrow(SpecValidationError);
    expect(() => parseSpec(null)).toThrow(SpecValidationError);
    expect(() => parseSpec(undefined)).toThrow(SpecValidationError);
  });
});

describe('validateSpec', () => {
  it('returns ok for a valid spec', () => {
    const result = validateSpec(validSpec);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.mark).toBe('line');
    }
  });

  it('returns errors for an invalid spec without throwing', () => {
    const result = validateSpec({ specVersion: '1', mark: 'donut' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Mark');
    }
  });

  it('collects all errors, not just the first', () => {
    const result = validateSpec({
      specVersion: '99',
      mark: 'donut',
      encoding: {},
      data: { values: [] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // both the bad version and the bad mark are reported
      expect(result.errors.join('\n')).toContain('"specVersion"');
      expect(result.errors.join('\n')).toContain('"mark"');
    }
  });
});

describe('encodeSpec', () => {
  it('round-trips a parsed spec to a JSON-safe value', () => {
    const spec = parseSpec(validSpec);
    const encoded = encodeSpec(spec);
    expect(encoded).toEqual(validSpec);
    // must survive JSON serialization unchanged (ProseMirror attr requirement)
    expect(JSON.parse(JSON.stringify(encoded))).toEqual(encoded);
  });

  it('round-trips parse(encode(spec)) to an identical spec', () => {
    const spec = parseSpec(validSpec);
    expect(parseSpec(encodeSpec(spec))).toEqual(spec);
  });
});

describe('SpecValidationError', () => {
  it('is a plain Error with a readable message and no Effect internals', () => {
    let caught: unknown;
    try {
      parseSpec({ ...validSpec, mark: 'donut' });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SpecValidationError);
    expect(caught).toBeInstanceOf(Error);
    const err = caught as SpecValidationError;
    expect(err.name).toBe('SpecValidationError');
    expect(err.message).toContain('mark');
  });
});

describe('type usage', () => {
  it('ChartSpec type is usable as a plain interface', () => {
    // Compile-time check: a literal object satisfies the public ChartSpec type
    // with no helpers, constructors, or Effect imports.
    const spec: ChartSpec = {
      specVersion: '1',
      mark: 'point',
      encoding: {
        x: { field: 'a', type: 'quantitative' },
        y: { field: 'b', type: 'quantitative' },
      },
      data: { values: [{ a: 1, b: 2 }] },
    };
    expect(parseSpec(spec)).toEqual(spec);
  });
});

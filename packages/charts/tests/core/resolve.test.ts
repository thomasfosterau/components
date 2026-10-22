import { resolveChart } from '../../src/core/index.ts';
import { parseSpec } from '../../src/spec/index.ts';
import { describe, expect, it } from 'vite-plus/test';

const box = { width: 400, height: 300 };

const barEncoding = {
  x: { field: 'cat', type: 'nominal' },
  y: { field: 'v', type: 'quantitative' },
} as const;

describe('resolveChart', () => {
  it('returns the validated spec and its context', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: barEncoding,
      data: { values: [{ cat: 'a', v: 1 }] },
    });
    const resolved = resolveChart(spec, box, undefined, { margins: { left: 10 } });
    expect(resolved.kind).toBe('ready');
    if (resolved.kind !== 'ready') return;
    expect(resolved.spec).toEqual(spec);
    expect(resolved.context.dimensions.margins.left).toBe(10);
    expect(resolved.context.geometry.mark).toBe('bar');
  });

  it('reports an invalid spec instead of throwing', () => {
    const resolved = resolveChart({ bogus: true }, box);
    expect(resolved).toEqual({
      kind: 'error',
      message: expect.stringMatching(/^Invalid chart spec: /),
    });
  });

  it('reports a data reference with no resolved rows', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: barEncoding,
      data: { ref: { kind: 'query', id: 'sales' } },
    });
    expect(resolveChart(spec, box)).toEqual({
      kind: 'error',
      message: 'Chart data is stored externally; pass resolved rows via the data prop',
    });
    expect(resolveChart(spec, box, [{ cat: 'a', v: 1 }]).kind).toBe('ready');
  });

  it('reports an error thrown while computing the geometry', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: barEncoding,
      data: { values: [{ cat: 'a', v: 'not a number' }] },
    });
    const resolved = resolveChart(spec, box);
    expect(resolved.kind).toBe('error');
  });
});

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

describe('resolveChart and newer 1.N specs', () => {
  const values = [{ cat: 'a', v: 1 }];

  it('returns the data table beside the context', () => {
    const resolved = resolveChart(
      { specVersion: '1', mark: 'bar', encoding: barEncoding, data: { values } },
      box,
    );
    expect(resolved.kind === 'ready' && resolved.table).toEqual({
      caption: undefined,
      columns: [
        { channels: ['x'], header: 'cat' },
        { channels: ['y'], header: 'v' },
      ],
      rows: [['a', '1']],
    });
    expect(resolved.kind === 'ready' && resolved.degradation).toBeUndefined();
  });

  it('draws a degraded spec from its known subset, reporting what it ignored', () => {
    const resolved = resolveChart(
      {
        specVersion: '1.3',
        mark: 'bar',
        encoding: { ...barEncoding, pattern: { field: 'cat', type: 'nominal' } },
        data: { values },
      },
      box,
    );
    expect(resolved.kind).toBe('ready');
    if (resolved.kind !== 'ready') return;
    expect(resolved.context.geometry.mark).toBe('bar');
    expect(resolved.degradation).toEqual({
      declaredVersion: '1.3',
      ignored: ['["encoding"]["pattern"]'],
    });
  });

  it('resolves an unknown mark to unsupported, with its table', () => {
    const sankey = { specVersion: '1.2', mark: 'sankey', encoding: barEncoding, data: { values } };
    const resolved = resolveChart(sankey, box);
    expect(resolved).toEqual({
      kind: 'unsupported',
      spec: { ...sankey, specVersion: '1.1' },
      table: expect.objectContaining({ rows: [['a', '1']] }),
      degradation: { declaredVersion: '1.2', ignored: [] },
      message: 'Chart mark "sankey" (spec 1.2) is not supported here; its data is shown as a table',
    });
  });

  it('needs rows for an unsupported mark whose data is a reference', () => {
    const sankey = {
      specVersion: '1.2',
      mark: 'sankey',
      encoding: barEncoding,
      data: { ref: { kind: 'query', id: 'flows' } },
    };
    expect(resolveChart(sankey, box)).toEqual({
      kind: 'error',
      message: 'Chart data is stored externally; pass resolved rows via the data prop',
    });
    expect(resolveChart(sankey, box, values).kind).toBe('unsupported');
    expect(resolveChart(sankey, box, [{ cat: 'a', v: 'x' }]).kind).toBe('error');
  });
});

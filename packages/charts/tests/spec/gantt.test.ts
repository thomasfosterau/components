/**
 * `ganttSpec` builds a valid spec 1.1 range-bar chart whose earliest task is
 * the top row, the same way in the core and in Vega-Lite (#305).
 */
import { describe, expect, it } from 'vite-plus/test';
import { computeContext } from '../../src/core/index.ts';
import { ganttSpec, parseSpec } from '../../src/spec/index.ts';
import { emitVegaLite } from '../../src/vega/index.ts';

const rows = [
  { task: 'Plant out', start: '2026-05-10', end: '2026-05-20', phase: 'Outdoors' },
  { task: 'Sow', start: '2026-03-01', end: '2026-03-15', phase: 'Indoors' },
  { task: 'Harden off', start: '2026-04-20', end: '2026-05-10', phase: 'Outdoors' },
  { task: 'Pot on', start: '2026-03-25', end: '2026-04-10', phase: 'Indoors' },
];

const options = { task: 'task', start: 'start', end: 'end' };

describe('ganttSpec', () => {
  it('builds a valid 1.1 range-bar spec over the rows in start order', () => {
    const spec = ganttSpec(rows, { ...options, group: 'phase', title: 'Tomatoes' });

    expect(parseSpec(spec)).toEqual(spec);
    expect(spec.specVersion).toBe('1.1');
    expect(spec.mark).toBe('bar');
    expect(spec.encoding).toEqual({
      y: { field: 'task', type: 'nominal' },
      x: { field: 'start', type: 'temporal' },
      x2: { field: 'end', type: 'temporal' },
      color: { field: 'phase', type: 'nominal' },
    });
    expect(spec.scales?.y?.domain).toEqual(['Sow', 'Pot on', 'Harden off', 'Plant out']);
    expect(spec.config).toEqual({ title: 'Tomatoes' });
  });

  it('leaves out color and config when no group or title is given, and never mutates the rows', () => {
    const before = structuredClone(rows);
    const spec = ganttSpec(rows, options);

    expect(spec.encoding.color).toBeUndefined();
    expect(spec.config).toBeUndefined();
    expect(rows).toEqual(before);
  });

  it('in the core, the earliest task is the top row', () => {
    const context = computeContext(
      ganttSpec(rows, options),
      { width: 400, height: 400 },
      undefined,
      {
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
      },
    );
    if (context.geometry.mark !== 'bar') throw new Error('expected bars');
    const y = context.scales.y;
    if (y === undefined) throw new Error('expected a y scale');
    const rowTop = (task: string): number => {
      const top = y.apply(task);
      return typeof top === 'number' ? top : Number.NaN;
    };

    expect(rowTop('Sow')).toBeLessThan(rowTop('Pot on'));
    expect(rowTop('Pot on')).toBeLessThan(rowTop('Harden off'));
    expect(rowTop('Harden off')).toBeLessThan(rowTop('Plant out'));
  });

  it('Vega-Lite receives the same top-down domain, unreversed', () => {
    const vegaLite = emitVegaLite(ganttSpec(rows, options));
    expect(JSON.stringify(vegaLite)).toContain(
      JSON.stringify(['Sow', 'Pot on', 'Harden off', 'Plant out']),
    );
  });

  it('quantitative time: plain numbers, and the x axis does not force zero', () => {
    const spec = ganttSpec(
      [
        { task: 'Second', start: 5, end: 9 },
        { task: 'First', start: 2, end: 6 },
      ],
      { ...options, time: 'quantitative' },
    );

    expect(spec.encoding.x?.type).toBe('quantitative');
    expect(spec.scales).toEqual({ y: { domain: ['First', 'Second'] }, x: { zero: false } });
  });

  it('a row with an unreadable start goes last', () => {
    const spec = ganttSpec(
      [
        { task: 'Unknown', start: null, end: null },
        { task: 'Known', start: '2026-01-01', end: '2026-01-02' },
      ],
      options,
    );
    expect(spec.scales?.y?.domain).toEqual(['Known', 'Unknown']);
  });
});

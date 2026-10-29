/**
 * Range bars in the core: each bar spans its start to its end, the end
 * widens the scale's domain, a range bar does not force zero, and a
 * reversed range is normalised.
 */
import { describe, expect, it } from 'vite-plus/test';
import { computeContext } from '../../src/core/index.ts';
import { parseSpec } from '../../src/spec/index.ts';

const box = { width: 400, height: 200 };

/** The bars of a computed bar chart, failing the test when it is not one or is short. */
function barsOf(context: ReturnType<typeof computeContext>, count: number) {
  if (context.geometry.mark !== 'bar') throw new Error('expected bars');
  const { bars } = context.geometry;
  expect(bars).toHaveLength(count);
  return (index: number) => {
    const bar = bars[index];
    if (bar === undefined) throw new Error(`no bar ${index}`);
    return bar;
  };
}
const margins = { top: 0, right: 0, bottom: 0, left: 0 };

describe('range bars', () => {
  it('horizontal: x to x2 in y bands, the domain covering both ends', () => {
    const spec = parseSpec({
      specVersion: '1.1',
      mark: 'bar',
      encoding: {
        y: { field: 'task', type: 'nominal' },
        x: { field: 'start', type: 'quantitative' },
        x2: { field: 'end', type: 'quantitative' },
      },
      data: {
        values: [
          { task: 'Sow', start: 10, end: 20 },
          { task: 'Grow', start: 20, end: 50 },
        ],
      },
    });
    const context = computeContext(spec, box, undefined, { margins });

    expect(context.scales.x?.domain).toEqual([10, 50]);
    const bar = barsOf(context, 2);
    const [sow, grow] = [bar(0), bar(1)];
    expect([sow.x, sow.width, grow.x, grow.width].map(Math.round)).toEqual([0, 100, 100, 300]);
    // One band per task: the same thickness, different rows.
    expect(sow.y).not.toBeCloseTo(grow.y);
    expect(sow.height).toBeCloseTo(grow.height);
  });

  it('temporal ranges, with an end before its start normalised', () => {
    const spec = parseSpec({
      specVersion: '1.1',
      mark: 'bar',
      encoding: {
        y: { field: 'task', type: 'nominal' },
        x: { field: 'start', type: 'temporal' },
        x2: { field: 'end', type: 'temporal' },
      },
      data: {
        values: [
          { task: 'Forward', start: '2026-09-01', end: '2026-09-11' },
          { task: 'Reversed', start: '2026-09-11', end: '2026-09-01' },
        ],
      },
    });
    const context = computeContext(spec, box, undefined, { margins });
    const bar = barsOf(context, 2);
    const [forward, reversed] = [bar(0), bar(1)];
    expect(reversed.x).toBeCloseTo(forward.x);
    expect(reversed.width).toBeCloseTo(forward.width);
    expect(forward.width).toBeGreaterThan(0);
  });

  it('vertical: y to y2 in x bands', () => {
    const spec = parseSpec({
      specVersion: '1.1',
      mark: 'bar',
      encoding: {
        x: { field: 'month', type: 'ordinal' },
        y: { field: 'low', type: 'quantitative' },
        y2: { field: 'high', type: 'quantitative' },
      },
      data: { values: [{ month: 'Jan', low: 5, high: 25 }] },
    });
    const context = computeContext(spec, box, undefined, { margins });
    const only = barsOf(context, 1)(0);
    expect(only.y).toBeCloseTo(0);
    expect(only.height).toBeCloseTo(200);
  });
});

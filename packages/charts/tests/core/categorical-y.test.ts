/**
 * A categorical y runs top-down (#305): the first category is the top band
 * or point, as Vega-Lite and ChartSpecKit draw it, so one spec reads the
 * same in every interpreter. A continuous y still runs bottom-up.
 */
import { describe, expect, it } from 'vite-plus/test';
import { computeContext } from '../../src/core/index.ts';
import { parseSpec } from '../../src/spec/index.ts';

const box = { width: 400, height: 300 };
const margins = { top: 0, right: 0, bottom: 0, left: 0 };

const rows = [
  { bed: 'Herbs', plants: 4 },
  { bed: 'Roses', plants: 9 },
  { bed: 'Veg', plants: 6 },
];

describe('categorical y order', () => {
  it('nominal y on a bar: the first category is the top band', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        y: { field: 'bed', type: 'nominal' },
        x: { field: 'plants', type: 'quantitative' },
      },
      data: { values: rows },
    });
    const context = computeContext(spec, box, undefined, { margins });

    expect(context.scales.y?.range).toEqual([0, 300]);
    if (context.geometry.mark !== 'bar') throw new Error('expected bars');
    const tops = context.geometry.bars.map((bar) => bar.y);
    expect(tops).toHaveLength(3);
    expect(tops).toEqual([...tops].toSorted((a, b) => a - b));
    expect(tops[0]).toBeLessThan(100);
  });

  it('ordinal y on points: the first category is the top point, and the ticks follow', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'point',
      encoding: {
        y: { field: 'bed', type: 'ordinal' },
        x: { field: 'plants', type: 'quantitative' },
      },
      data: { values: rows },
    });
    const context = computeContext(spec, box, undefined, { margins });

    if (context.geometry.mark !== 'point') throw new Error('expected points');
    const ys = context.geometry.points.map((point) => point.cy);
    expect(ys).toEqual([...ys].toSorted((a, b) => a - b));
    expect(new Set(ys).size).toBe(3);
    const ticks = context.ticks.y ?? [];
    expect(ticks.map((tick) => tick.label)).toEqual(['Herbs', 'Roses', 'Veg']);
    const positions = ticks.map((tick) => tick.position);
    expect(positions).toEqual([...positions].toSorted((a, b) => a - b));
  });

  it('a quantitative y still runs bottom-up', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'bed', type: 'nominal' },
        y: { field: 'plants', type: 'quantitative' },
      },
      data: { values: rows },
    });
    const context = computeContext(spec, box, undefined, { margins });

    expect(context.scales.y?.range).toEqual([300, 0]);
  });
});

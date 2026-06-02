import { parseSpec } from '@thomasfosterau/chart-spec';
import { describe, expect, it } from 'vitest';
import { computeContext } from '../src/index.ts';

const box = { width: 100, height: 100 };
const noMargins = { margins: { top: 0, right: 0, bottom: 0, left: 0 } };

function specFor(mark: 'bar' | 'line' | 'point' | 'area', values: unknown[]) {
  return parseSpec({
    specVersion: '1',
    mark,
    encoding: {
      x: { field: 'x', type: 'quantitative' },
      y: { field: 'y', type: 'quantitative' },
    },
    data: { values },
  });
}

describe('edge cases', () => {
  describe('empty data', () => {
    it.each(['bar', 'line', 'point', 'area'] as const)(
      '%s mark produces empty geometry without throwing',
      (mark) => {
        const context = computeContext(specFor(mark, []), box, undefined, noMargins);
        switch (context.geometry.mark) {
          case 'line':
          case 'area':
            // a single empty series (no colour split)
            expect(context.geometry.series.flatMap((s) => s.points)).toHaveLength(0);
            break;
          case 'bar':
            expect(context.geometry.bars).toHaveLength(0);
            break;
          case 'point':
            expect(context.geometry.points).toHaveLength(0);
            break;
        }
      },
    );

    it('falls back to a sane default quantitative domain', () => {
      const context = computeContext(specFor('line', []), box, undefined, noMargins);
      expect(context.scales.x?.domain).toEqual([0, 1]);
    });

    it('produces an empty categorical domain', () => {
      const spec = parseSpec({
        specVersion: '1',
        mark: 'bar',
        encoding: {
          x: { field: 'cat', type: 'nominal' },
          y: { field: 'v', type: 'quantitative' },
        },
        data: { values: [] },
      });
      const context = computeContext(spec, box, undefined, noMargins);
      expect(context.scales.x?.domain).toEqual([]);
      expect(context.ticks.x).toEqual([]);
    });
  });

  describe('single data point', () => {
    it('pads degenerate quantitative domains so the scale is usable', () => {
      const context = computeContext(specFor('point', [{ x: 5, y: 5 }]), box, undefined, noMargins);
      expect(context.scales.x?.domain).toEqual([4, 6]);
      // the single point sits in the middle of the padded domain
      if (context.geometry.mark === 'point') {
        expect(context.geometry.points[0]!.cx).toBe(50);
        expect(context.geometry.points[0]!.cy).toBe(50);
      }
    });

    it('pads degenerate temporal domains by a day either side', () => {
      const spec = parseSpec({
        specVersion: '1',
        mark: 'line',
        encoding: {
          x: { field: 'd', type: 'temporal' },
          y: { field: 'v', type: 'quantitative' },
        },
        data: { values: [{ d: '2024-06-15', v: 1 }] },
      });
      const context = computeContext(spec, box, undefined, noMargins);
      const [lo, hi] = context.scales.x!.domain as [Date, Date];
      expect(hi.getTime() - lo.getTime()).toBe(2 * 24 * 60 * 60 * 1000);
    });

    it('renders a single-point line as one point with a move-to path', () => {
      const context = computeContext(specFor('line', [{ x: 5, y: 5 }]), box, undefined, noMargins);
      if (context.geometry.mark === 'line') {
        expect(context.geometry.series[0]!.points).toHaveLength(1);
        expect(context.geometry.series[0]!.path).toMatch(/^M/);
      }
    });
  });

  describe('missing and partial encodings', () => {
    it('produces empty geometry when x or y encoding is missing', () => {
      const spec = parseSpec({
        specVersion: '1',
        mark: 'line',
        encoding: { x: { field: 'x', type: 'quantitative' } },
        data: { values: [{ x: 1 }] },
      });
      const context = computeContext(spec, box, undefined, noMargins);
      if (context.geometry.mark === 'line') {
        expect(context.geometry.series).toHaveLength(0);
      }
      // the x scale still resolves (e.g. for axis rendering)
      expect(context.scales.x).toBeDefined();
      expect(context.scales.y).toBeUndefined();
      expect(context.ticks.y).toBeUndefined();
    });

    it('skips rows missing the encoded field entirely', () => {
      const context = computeContext(
        specFor('point', [{ x: 1, y: 1 }, { x: 2 }, { y: 3 }, { x: 4, y: 4 }]),
        box,
        undefined,
        noMargins,
      );
      if (context.geometry.mark === 'point') {
        expect(context.geometry.points).toHaveLength(2);
      }
    });
  });

  describe('declared-type violations', () => {
    it('throws TypeError when a quantitative field holds a string', () => {
      expect(() =>
        computeContext(specFor('line', [{ x: 'oops', y: 1 }]), box, undefined, noMargins),
      ).toThrow(TypeError);
    });

    it('throws TypeError when a temporal field holds an unparseable value', () => {
      const spec = parseSpec({
        specVersion: '1',
        mark: 'line',
        encoding: {
          x: { field: 'd', type: 'temporal' },
          y: { field: 'v', type: 'quantitative' },
        },
        data: { values: [{ d: 'tomorrow-ish', v: 1 }] },
      });
      expect(() => computeContext(spec, box, undefined, noMargins)).toThrow(TypeError);
    });
  });

  describe('zero-sized boxes', () => {
    it('does not throw for a zero-sized box', () => {
      const context = computeContext(
        specFor('bar', [{ x: 1, y: 1 }]),
        { width: 0, height: 0 },
        undefined,
        noMargins,
      );
      expect(context.dimensions.plot).toEqual({ width: 0, height: 0 });
    });

    it('does not throw when margins exceed the box', () => {
      const context = computeContext(specFor('line', [{ x: 1, y: 1 }]), {
        width: 10,
        height: 10,
      });
      expect(context.dimensions.plot.width).toBe(0);
      expect(context.dimensions.plot.height).toBe(0);
    });
  });
});

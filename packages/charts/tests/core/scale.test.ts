import { describe, expect, it } from 'vitest';
import {
  CATEGORICAL_PALETTE,
  DEFAULT_RADIUS_RANGE,
  resolveColorScale,
  resolvePositionalScale,
  resolveSizeScale,
} from '../../src/core/index.ts';

const range: readonly [number, number] = [0, 100];

describe('resolvePositionalScale', () => {
  describe('quantitative → linear', () => {
    it('resolves a linear scale over the data extent', () => {
      const scale = resolvePositionalScale({ field: 'v', type: 'quantitative' }, 'line', range, [
        { v: 0 },
        { v: 5 },
        { v: 10 },
      ]);
      expect(scale.kind).toBe('linear');
      expect(scale.resolved.domain).toEqual([0, 10]);
      expect(scale.resolved.range).toEqual([0, 100]);
      expect(scale.resolved.apply(5)).toBe(50);
      expect(scale.resolved.bandwidth).toBe(0);
    });

    it('does not include zero by default for non-bar marks', () => {
      const scale = resolvePositionalScale({ field: 'v', type: 'quantitative' }, 'line', range, [
        { v: 5 },
        { v: 10 },
      ]);
      expect(scale.resolved.domain).toEqual([5, 10]);
    });

    it('includes zero for bar marks (bars grow from a zero baseline)', () => {
      const scale = resolvePositionalScale({ field: 'v', type: 'quantitative' }, 'bar', range, [
        { v: 5 },
        { v: 10 },
      ]);
      expect(scale.resolved.domain).toEqual([0, 10]);
    });

    it('honours the zero hint over the mark default', () => {
      const scale = resolvePositionalScale(
        { field: 'v', type: 'quantitative' },
        'line',
        range,
        [{ v: 5 }, { v: 10 }],
        { zero: true },
      );
      expect(scale.resolved.domain).toEqual([0, 10]);
    });

    it('honours the nice hint', () => {
      const scale = resolvePositionalScale(
        { field: 'v', type: 'quantitative' },
        'line',
        range,
        [{ v: 0.13 }, { v: 9.87 }],
        { nice: true },
      );
      const [lo, hi] = scale.resolved.domain as [number, number];
      expect(lo).toBeLessThanOrEqual(0.13);
      expect(hi).toBeGreaterThanOrEqual(9.87);
      expect(Number.isInteger(lo)).toBe(true);
      expect(Number.isInteger(hi)).toBe(true);
    });

    it('honours an explicit domain hint', () => {
      const scale = resolvePositionalScale(
        { field: 'v', type: 'quantitative' },
        'line',
        range,
        [{ v: 5 }],
        { domain: [0, 20] },
      );
      expect(scale.resolved.domain).toEqual([0, 20]);
      expect(scale.resolved.apply(10)).toBe(50);
    });
  });

  describe('temporal → UTC', () => {
    it('resolves a UTC time scale over the data extent', () => {
      const scale = resolvePositionalScale({ field: 'date', type: 'temporal' }, 'line', range, [
        { date: '2024-01-01' },
        { date: '2024-01-03' },
      ]);
      expect(scale.kind).toBe('utc');
      expect(scale.resolved.apply(new Date('2024-01-01'))).toBe(0);
      expect(scale.resolved.apply(new Date('2024-01-02'))).toBe(50);
      expect(scale.resolved.apply(new Date('2024-01-03'))).toBe(100);
    });

    it('exposes Date domain values', () => {
      const scale = resolvePositionalScale({ field: 'date', type: 'temporal' }, 'line', range, [
        { date: '2024-01-01' },
        { date: '2024-01-03' },
      ]);
      const domain = scale.resolved.domain;
      expect(domain[0]).toBeInstanceOf(Date);
      expect((domain[0] as Date).toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('categorical → band or point depending on mark', () => {
    const data = [{ cat: 'a' }, { cat: 'b' }, { cat: 'c' }];

    it('nominal on a bar mark resolves a band scale with bandwidth', () => {
      const scale = resolvePositionalScale({ field: 'cat', type: 'nominal' }, 'bar', range, data);
      expect(scale.kind).toBe('band');
      expect(scale.resolved.domain).toEqual(['a', 'b', 'c']);
      expect(scale.resolved.bandwidth).toBeGreaterThan(0);
    });

    it('nominal on line/point/area marks resolves a point scale', () => {
      for (const mark of ['line', 'point', 'area'] as const) {
        const scale = resolvePositionalScale({ field: 'cat', type: 'nominal' }, mark, range, data);
        expect(scale.kind).toBe('point');
        expect(scale.resolved.bandwidth).toBe(0);
      }
    });

    it('ordinal behaves like nominal for positioning', () => {
      const scale = resolvePositionalScale({ field: 'cat', type: 'ordinal' }, 'bar', range, data);
      expect(scale.kind).toBe('band');
    });

    it('preserves data order in the domain', () => {
      const scale = resolvePositionalScale({ field: 'cat', type: 'nominal' }, 'point', range, [
        { cat: 'zebra' },
        { cat: 'apple' },
        { cat: 'zebra' },
        { cat: 'mango' },
      ]);
      expect(scale.resolved.domain).toEqual(['zebra', 'apple', 'mango']);
    });

    it('honours an explicit domain hint (category ordering)', () => {
      const scale = resolvePositionalScale({ field: 'cat', type: 'ordinal' }, 'bar', range, data, {
        domain: ['c', 'b', 'a'],
      });
      expect(scale.resolved.domain).toEqual(['c', 'b', 'a']);
    });
  });
});

describe('resolveColorScale', () => {
  it('maps nominal categories onto the categorical palette', () => {
    const scale = resolveColorScale({ field: 'kind', type: 'nominal' }, [
      { kind: 'a' },
      { kind: 'b' },
    ]);
    expect(scale.kind).toBe('ordinal');
    expect(scale.apply('a')).toBe(CATEGORICAL_PALETTE[0]);
    expect(scale.apply('b')).toBe(CATEGORICAL_PALETTE[1]);
  });

  it('maps quantitative values onto a normalised [0, 1] scale', () => {
    const scale = resolveColorScale({ field: 'v', type: 'quantitative' }, [{ v: 0 }, { v: 10 }]);
    expect(scale.kind).toBe('linear');
    expect(scale.range).toEqual([0, 1]);
    expect(scale.apply(5)).toBe(0.5);
  });
});

describe('resolveSizeScale', () => {
  it('maps quantitative values onto the radius range with sqrt scaling', () => {
    const scale = resolveSizeScale({ field: 'v', type: 'quantitative' }, [{ v: 0 }, { v: 100 }]);
    expect(scale.apply(0)).toBe(DEFAULT_RADIUS_RANGE[0]);
    expect(scale.apply(100)).toBe(DEFAULT_RADIUS_RANGE[1]);
    // sqrt scaling: the midpoint of the domain maps past the midpoint of the radius range
    const mid = scale.apply(50);
    expect(mid).toBeGreaterThan((DEFAULT_RADIUS_RANGE[0] + DEFAULT_RADIUS_RANGE[1]) / 2);
  });
});

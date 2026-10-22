import { describe, expect, it } from 'vite-plus/test';
import { computeTicks, resolvePositionalScale } from '../../src/core/index.ts';

const range: readonly [number, number] = [0, 100];

describe('computeTicks', () => {
  it('produces evenly spaced numeric ticks with labels for linear scales', () => {
    const scale = resolvePositionalScale({ field: 'v', type: 'quantitative' }, 'line', range, [
      { v: 0 },
      { v: 10 },
    ]);
    const ticks = computeTicks(scale);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    expect(ticks[0]).toEqual({ value: 0, position: 0, label: '0' });
    expect(ticks.at(-1)).toEqual({ value: 10, position: 100, label: '10' });
  });

  it('produces deterministic UTC ticks for temporal scales', () => {
    const scale = resolvePositionalScale({ field: 'd', type: 'temporal' }, 'line', range, [
      { d: '2024-01-01' },
      { d: '2024-01-05' },
    ]);
    const ticks = computeTicks(scale);
    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(tick.value).toBeInstanceOf(Date);
      expect(tick.position).toBeGreaterThanOrEqual(0);
      expect(tick.position).toBeLessThanOrEqual(100);
      expect(tick.label.length).toBeGreaterThan(0);
    }
  });

  it('produces one centred tick per category for band scales', () => {
    const scale = resolvePositionalScale({ field: 'c', type: 'nominal' }, 'bar', range, [
      { c: 'a' },
      { c: 'b' },
    ]);
    const ticks = computeTicks(scale);
    expect(ticks).toHaveLength(2);
    expect(ticks.map((tick) => tick.label)).toEqual(['a', 'b']);
    // centred ticks: first in the left half, second in the right half
    expect(ticks[0]!.position).toBeGreaterThan(0);
    expect(ticks[0]!.position).toBeLessThan(50);
    expect(ticks[1]!.position).toBeGreaterThan(50);
    expect(ticks[1]!.position).toBeLessThan(100);
  });

  it('produces one tick per category for point scales', () => {
    const scale = resolvePositionalScale({ field: 'c', type: 'nominal' }, 'line', range, [
      { c: 'a' },
      { c: 'b' },
      { c: 'c' },
    ]);
    const ticks = computeTicks(scale);
    expect(ticks).toHaveLength(3);
  });

  it('honours a custom tick count for continuous scales', () => {
    const scale = resolvePositionalScale({ field: 'v', type: 'quantitative' }, 'line', range, [
      { v: 0 },
      { v: 100 },
    ]);
    const few = computeTicks(scale, 2);
    const many = computeTicks(scale, 20);
    expect(few.length).toBeLessThan(many.length);
  });
});

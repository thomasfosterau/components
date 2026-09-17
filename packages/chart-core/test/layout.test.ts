import { describe, expect, it } from 'vitest';
import { computeDimensions, DEFAULT_MARGINS } from '../src/index.ts';

describe('computeDimensions', () => {
  it('applies default margins', () => {
    const dims = computeDimensions({ width: 600, height: 400 });
    expect(dims.margins).toEqual(DEFAULT_MARGINS);
    expect(dims.plot).toEqual({
      width: 600 - DEFAULT_MARGINS.left - DEFAULT_MARGINS.right,
      height: 400 - DEFAULT_MARGINS.top - DEFAULT_MARGINS.bottom,
    });
    expect(dims.outer).toEqual({ width: 600, height: 400 });
  });

  it('merges partial margin overrides', () => {
    const dims = computeDimensions({ width: 600, height: 400 }, { left: 100 });
    expect(dims.margins.left).toBe(100);
    expect(dims.margins.top).toBe(DEFAULT_MARGINS.top);
    expect(dims.plot.width).toBe(600 - 100 - DEFAULT_MARGINS.right);
  });

  it('clamps the plot area to zero when margins exceed the box', () => {
    const dims = computeDimensions({ width: 50, height: 30 }, { left: 40, right: 40 });
    expect(dims.plot.width).toBe(0);
    expect(dims.plot.height).toBeGreaterThanOrEqual(0);
  });
});

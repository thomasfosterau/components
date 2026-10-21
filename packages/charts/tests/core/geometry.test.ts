import { describe, expect, it } from 'vitest';
import {
  buildAreaGeometry,
  buildBarGeometry,
  buildLineGeometry,
  buildPointGeometry,
  CATEGORICAL_PALETTE,
  DEFAULT_POINT_RADIUS,
  resolveColorScale,
  resolvePositionalScale,
  resolveSizeScale,
} from '../../src/core/index.ts';
import type { Channel } from '../../src/spec/index.ts';

/**
 * Fixture: a 100×100 plot with quantitative x and y over [0, 10].
 * x: 0→0px, 10→100px. y (inverted): 0→100px, 10→0px.
 */
const xChannel: Channel = { field: 'x', type: 'quantitative' };
const yChannel: Channel = { field: 'y', type: 'quantitative' };
const xRange: readonly [number, number] = [0, 100];
const yRange: readonly [number, number] = [100, 0];

function quantScales(data: ReadonlyArray<Record<string, string | number | boolean | null>>) {
  return {
    xScale: resolvePositionalScale(xChannel, 'line', xRange, data),
    yScale: resolvePositionalScale(yChannel, 'line', yRange, data),
  };
}

describe('buildLineGeometry', () => {
  const data = [
    { x: 0, y: 0 },
    { x: 5, y: 10 },
    { x: 10, y: 5 },
  ];

  it('maps data to exact pixel positions', () => {
    const geometry = buildLineGeometry({ data, x: xChannel, y: yChannel, ...quantScales(data) });
    expect(geometry.mark).toBe('line');
    expect(geometry.series).toHaveLength(1);
    const series = geometry.series[0]!;
    expect(series.key).toBeNull();
    expect(series.color).toBeUndefined();
    expect(series.points.map((p) => [p.x, p.y])).toEqual([
      [0, 100], // (0,0) → bottom left
      [50, 0], // (5,10) → top centre
      [100, 50], // (10,5) → middle right
    ]);
  });

  it('produces an SVG path through the points', () => {
    const geometry = buildLineGeometry({ data, x: xChannel, y: yChannel, ...quantScales(data) });
    expect(geometry.series[0]!.path).toBe('M0,100L50,0L100,50');
  });

  it('attaches the source datum to each point', () => {
    const geometry = buildLineGeometry({ data, x: xChannel, y: yChannel, ...quantScales(data) });
    expect(geometry.series[0]!.points[1]!.datum).toEqual({ x: 5, y: 10 });
  });

  it('skips rows with missing positional values', () => {
    const withGaps = [
      { x: 0, y: 0 },
      { x: 5, y: null },
      { x: 10, y: 5 },
    ];
    const geometry = buildLineGeometry({
      data: withGaps,
      x: xChannel,
      y: yChannel,
      ...quantScales(withGaps),
    });
    expect(geometry.series[0]!.points).toHaveLength(2);
  });

  it('splits series by the colour channel', () => {
    const colorChannel: Channel = { field: 'kind', type: 'nominal' };
    const grouped = [
      { x: 0, y: 0, kind: 'a' },
      { x: 5, y: 10, kind: 'b' },
      { x: 10, y: 5, kind: 'a' },
    ];
    const geometry = buildLineGeometry({
      data: grouped,
      x: xChannel,
      y: yChannel,
      ...quantScales(grouped),
      color: colorChannel,
      colorScale: resolveColorScale(colorChannel, grouped),
    });
    expect(geometry.series).toHaveLength(2);
    expect(geometry.series.map((s) => s.key)).toEqual(['a', 'b']);
    expect(geometry.series[0]!.points).toHaveLength(2);
    expect(geometry.series[1]!.points).toHaveLength(1);
    expect(geometry.series[0]!.color).toBe(CATEGORICAL_PALETTE[0]);
    expect(geometry.series[1]!.color).toBe(CATEGORICAL_PALETTE[1]);
  });
});

describe('buildAreaGeometry', () => {
  it('clamps the baseline to the plot bottom when zero is outside the y domain', () => {
    const data = [
      { x: 0, y: 5 },
      { x: 10, y: 10 },
    ];
    // Explicit y domain [5, 15]: y(5)=100, y(10)=50, y(15)=0.
    // Zero would map below the plot (y(0)=150), so the baseline clamps to 100.
    const xScale = resolvePositionalScale(xChannel, 'area', xRange, data);
    const yScale = resolvePositionalScale(yChannel, 'area', yRange, data, { domain: [5, 15] });
    const geometry = buildAreaGeometry({ data, x: xChannel, y: yChannel, xScale, yScale });
    // Top line: (0,100) → (100,50); closed along the clamped baseline.
    expect(geometry.series[0]!.path).toBe('M0,100L100,50L100,100L0,100Z');
  });

  it('uses the zero baseline when zero is in the domain', () => {
    const withZero = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const geometry = buildAreaGeometry({
      data: withZero,
      x: xChannel,
      y: yChannel,
      ...quantScales(withZero),
    });
    // y domain [0,10]: baseline at y(0) = 100px
    expect(geometry.series[0]!.path).toBe('M0,100L100,0L100,100L0,100Z');
  });
});

describe('buildBarGeometry', () => {
  const catChannel: Channel = { field: 'cat', type: 'nominal' };

  it('produces one bar per datum with band positioning and zero baseline', () => {
    const data = [
      { cat: 'a', y: 10 },
      { cat: 'b', y: 5 },
    ];
    const xScale = resolvePositionalScale(catChannel, 'bar', xRange, data);
    const yScale = resolvePositionalScale(yChannel, 'bar', yRange, data);
    const geometry = buildBarGeometry({ data, x: catChannel, y: yChannel, xScale, yScale });

    expect(geometry.mark).toBe('bar');
    expect(geometry.bars).toHaveLength(2);

    const [barA, barB] = geometry.bars;
    // y domain [0, 10] (bar includes zero): y(10)=0, y(5)=50, baseline y(0)=100
    expect(barA!.y).toBe(0);
    expect(barA!.height).toBe(100);
    expect(barB!.y).toBe(50);
    expect(barB!.height).toBe(50);
    // bars use the band width
    expect(barA!.width).toBe(xScale.resolved.bandwidth);
    expect(barA!.width).toBeGreaterThan(0);
  });

  it('grows bars downward from the baseline for negative values', () => {
    const data = [
      { cat: 'up', y: 5 },
      { cat: 'down', y: -5 },
    ];
    const xScale = resolvePositionalScale(catChannel, 'bar', xRange, data);
    const yScale = resolvePositionalScale(yChannel, 'bar', yRange, data);
    const geometry = buildBarGeometry({ data, x: catChannel, y: yChannel, xScale, yScale });

    // y domain [-5, 5]: y(5)=0, y(0)=50 (baseline), y(-5)=100
    const [up, down] = geometry.bars;
    expect(up!.y).toBe(0);
    expect(up!.height).toBe(50);
    expect(down!.y).toBe(50); // starts at the baseline
    expect(down!.height).toBe(50); // extends down
  });

  it('colours bars via the colour channel', () => {
    const colorChannel: Channel = { field: 'cat', type: 'nominal' };
    const data = [
      { cat: 'a', y: 1 },
      { cat: 'b', y: 2 },
    ];
    const xScale = resolvePositionalScale(catChannel, 'bar', xRange, data);
    const yScale = resolvePositionalScale(yChannel, 'bar', yRange, data);
    const geometry = buildBarGeometry({
      data,
      x: catChannel,
      y: yChannel,
      xScale,
      yScale,
      color: colorChannel,
      colorScale: resolveColorScale(colorChannel, data),
    });
    expect(geometry.bars[0]!.color).toBe(CATEGORICAL_PALETTE[0]);
    expect(geometry.bars[1]!.color).toBe(CATEGORICAL_PALETTE[1]);
  });

  it('derives a bar width for continuous x scales', () => {
    const data = [
      { x: 0, y: 1 },
      { x: 10, y: 2 },
    ];
    const xScale = resolvePositionalScale(xChannel, 'bar', xRange, data);
    const yScale = resolvePositionalScale(yChannel, 'bar', yRange, data);
    const geometry = buildBarGeometry({ data, x: xChannel, y: yChannel, xScale, yScale });
    expect(geometry.bars).toHaveLength(2);
    for (const bar of geometry.bars) {
      expect(bar.width).toBeGreaterThan(0);
    }
  });
});

describe('buildPointGeometry', () => {
  const data = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
  ];

  it('produces one circle per datum at exact positions with the default radius', () => {
    const geometry = buildPointGeometry({ data, x: xChannel, y: yChannel, ...quantScales(data) });
    expect(geometry.mark).toBe('point');
    expect(geometry.points.map((p) => [p.cx, p.cy, p.r])).toEqual([
      [0, 100, DEFAULT_POINT_RADIUS],
      [100, 0, DEFAULT_POINT_RADIUS],
    ]);
  });

  it('sizes points via the size channel', () => {
    const sizeChannel: Channel = { field: 'amount', type: 'quantitative' };
    const sized = [
      { x: 0, y: 0, amount: 0 },
      { x: 10, y: 10, amount: 100 },
    ];
    const geometry = buildPointGeometry({
      data: sized,
      x: xChannel,
      y: yChannel,
      ...quantScales(sized),
      size: sizeChannel,
      sizeScale: resolveSizeScale(sizeChannel, sized),
    });
    expect(geometry.points[1]!.r).toBeGreaterThan(geometry.points[0]!.r);
  });

  it('colours points via the colour channel', () => {
    const colorChannel: Channel = { field: 'kind', type: 'nominal' };
    const colored = [
      { x: 0, y: 0, kind: 'a' },
      { x: 10, y: 10, kind: 'b' },
    ];
    const geometry = buildPointGeometry({
      data: colored,
      x: xChannel,
      y: yChannel,
      ...quantScales(colored),
      color: colorChannel,
      colorScale: resolveColorScale(colorChannel, colored),
    });
    expect(geometry.points[0]!.color).toBe(CATEGORICAL_PALETTE[0]);
    expect(geometry.points[1]!.color).toBe(CATEGORICAL_PALETTE[1]);
  });
});

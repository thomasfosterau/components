import { isInlineData, type ChartSpec } from '../spec/index.ts';
import { buildAreaGeometry } from './geometry/area.ts';
import { buildBarGeometry } from './geometry/bar.ts';
import { buildLineGeometry } from './geometry/line.ts';
import { buildPointGeometry } from './geometry/point.ts';
import type { Geometry } from './geometry/types.ts';
import { computeDimensions } from './layout.ts';
import {
  resolveColorScale,
  resolvePositionalScale,
  resolveSizeScale,
  type PositionalScale,
} from './scale.ts';
import { computeTicks } from './ticks.ts';
import type {
  Box,
  ChartContext,
  ChartScales,
  ChartTicks,
  ComputeContextOptions,
  DataRows,
  ResolvedScale,
} from './types.ts';

/**
 * The Layer 2 entry point: turns (spec, measured box, resolved data) into
 * everything an interpreter needs to draw — dimensions, scales, geometry,
 * and ticks.
 *
 * Pure and synchronous: no DOM, no reactivity, no rendering, no data
 * fetching. When the spec's data is a reference (`data.ref`), the host must
 * resolve it and pass the rows; this function never fetches.
 *
 * @param spec - A parsed portable chart spec.
 * @param box - The measured outer pixel box available to the chart.
 * @param data - Resolved data rows. Optional when the spec carries inline values.
 * @param options - Layout options (margins).
 *
 * @throws {Error} when no data rows are available (spec has a ref and no rows were passed).
 * @throws {TypeError} when a datum value contradicts its channel's declared type.
 */
export function computeContext(
  spec: ChartSpec,
  box: Box,
  data?: DataRows,
  options?: ComputeContextOptions,
): ChartContext {
  const rows = resolveRows(spec, data);
  const dimensions = computeDimensions(box, options?.margins);

  // Positional scales: x → [0, plot width], y → [plot height, 0] (y inverted:
  // larger values sit higher on screen).
  const xPositional = spec.encoding.x
    ? resolvePositionalScale(
        spec.encoding.x,
        spec.mark,
        [0, dimensions.plot.width],
        rows,
        spec.scales?.x,
        spec.encoding.x2,
      )
    : undefined;
  const yPositional = spec.encoding.y
    ? resolvePositionalScale(
        spec.encoding.y,
        spec.mark,
        [dimensions.plot.height, 0],
        rows,
        spec.scales?.y,
        spec.encoding.y2,
      )
    : undefined;

  const colorScale = spec.encoding.color ? resolveColorScale(spec.encoding.color, rows) : undefined;
  const sizeScale = spec.encoding.size ? resolveSizeScale(spec.encoding.size, rows) : undefined;

  return {
    dimensions,
    scales: buildScales(xPositional, yPositional, colorScale, sizeScale),
    geometry: buildGeometry(spec, rows, xPositional, yPositional, colorScale, sizeScale),
    ticks: buildTicks(xPositional, yPositional),
  };
}

function resolveRows(spec: ChartSpec, data?: DataRows): DataRows {
  if (data) return data;
  if (isInlineData(spec.data)) return spec.data.values;
  throw new Error(
    `Chart data is a ${spec.data.ref.kind} reference ("${spec.data.ref.id}"); the host must resolve it and pass rows to computeContext`,
  );
}

function buildScales(
  x: PositionalScale | undefined,
  y: PositionalScale | undefined,
  color: ResolvedScale | undefined,
  size: ResolvedScale | undefined,
): ChartScales {
  return {
    ...(x ? { x: x.resolved } : {}),
    ...(y ? { y: y.resolved } : {}),
    ...(color ? { color } : {}),
    ...(size ? { size } : {}),
  };
}

function buildTicks(x: PositionalScale | undefined, y: PositionalScale | undefined): ChartTicks {
  return {
    ...(x ? { x: computeTicks(x) } : {}),
    ...(y ? { y: computeTicks(y) } : {}),
  };
}

function buildGeometry(
  spec: ChartSpec,
  rows: DataRows,
  xScale: PositionalScale | undefined,
  yScale: PositionalScale | undefined,
  colorScale: ResolvedScale | undefined,
  sizeScale: ResolvedScale | undefined,
): Geometry {
  // Both positional encodings are required to produce geometry; without them
  // the chart renders as an empty plot (see the capability matrix).
  if (!spec.encoding.x || !spec.encoding.y || !xScale || !yScale) {
    return emptyGeometry(spec.mark);
  }

  const args = {
    data: rows,
    x: spec.encoding.x,
    y: spec.encoding.y,
    xScale,
    yScale,
    color: spec.encoding.color,
    colorScale,
  };

  switch (spec.mark) {
    case 'line':
      return buildLineGeometry(args);
    case 'area':
      return buildAreaGeometry(args);
    case 'bar':
      return buildBarGeometry({ ...args, x2: spec.encoding.x2, y2: spec.encoding.y2 });
    case 'point':
      return buildPointGeometry({ ...args, size: spec.encoding.size, sizeScale });
  }
}

function emptyGeometry(mark: ChartSpec['mark']): Geometry {
  switch (mark) {
    case 'line':
      return { mark: 'line', series: [] };
    case 'area':
      return { mark: 'area', series: [] };
    case 'bar':
      return { mark: 'bar', bars: [] };
    case 'point':
      return { mark: 'point', points: [] };
  }
}

/**
 * Narrows a computed chart's geometry to one mark, failing the test when the
 * core drew another, so an assertion on the narrowed geometry always runs.
 */
import type { ChartContext, Geometry } from '../../src/core/index.ts';

type Mark = Geometry['mark'];
type GeometryOf<M extends Mark> = Extract<Geometry, { readonly mark: M }>;

const isMark = <M extends Mark>(geometry: Geometry, mark: M): geometry is GeometryOf<M> =>
  geometry.mark === mark;

/** The geometry of `context`, which must be a `mark` chart. */
export function geometryOf<M extends Mark>(context: ChartContext, mark: M): GeometryOf<M> {
  const { geometry } = context;
  if (!isMark(geometry, mark)) throw new Error(`expected ${mark} geometry, got ${geometry.mark}`);
  return geometry;
}

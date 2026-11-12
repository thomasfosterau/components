import {
  isDataRef,
  validateSpec,
  type ChartSpec,
  type Data,
  type SpecDegradation,
  type UnsupportedMarkSpec,
} from '../spec/index.ts';
import { computeContext } from './context.ts';
import { buildDataTable, type DataTable, type DataTableOptions } from './table.ts';
import type { Box, ChartContext, ComputeContextOptions, DataRows } from './types.ts';

/** Options for {@link resolveChart}: the layout's, and the data table's. */
export interface ResolveChartOptions extends ComputeContextOptions, DataTableOptions {}

/**
 * The result of {@link resolveChart}: a validated spec with its geometry
 * and data table; a newer `1.N` spec whose mark this interpreter does not
 * know, with the data table to show in its place; or the message an
 * interpreter shows in place of the chart.
 */
export type ResolvedChart =
  | {
      readonly kind: 'ready';
      readonly spec: ChartSpec;
      readonly context: ChartContext;
      /** The chart's data as a table: the text alternative drawn beside it, visually hidden. */
      readonly table: DataTable;
      /** Present when the spec declared a newer `1.N`: the keys ignored to read it. */
      readonly degradation?: SpecDegradation | undefined;
    }
  | {
      readonly kind: 'unsupported';
      readonly spec: UnsupportedMarkSpec;
      /** The chart's data as a table, which the interpreter shows instead of a drawing. */
      readonly table: DataTable;
      readonly degradation: SpecDegradation;
      /** Why the chart is a table, in English, naming the mark. */
      readonly message: string;
    }
  | { readonly kind: 'error'; readonly message: string };

const MISSING_ROWS = 'Chart data is stored externally; pass resolved rows via the data prop';

/** The rows a chart shows: the caller's, else its inline values; `undefined` for an unresolved ref. */
function rowsOf(data: Data, rows: DataRows | undefined): DataRows | undefined {
  if (rows) return rows;
  return isDataRef(data) ? undefined : data.values;
}

/** The message of a thrown value, or `fallback`. */
function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** The `unsupported` outcome: the spec's data as a table, or an error when its rows are unusable. */
function resolveUnsupported(
  spec: UnsupportedMarkSpec,
  degradation: SpecDegradation,
  data: DataRows | undefined,
  options: ResolveChartOptions | undefined,
): ResolvedChart {
  const rows = rowsOf(spec.data, data);
  if (rows === undefined) return { kind: 'error', message: MISSING_ROWS };
  try {
    return {
      kind: 'unsupported',
      spec,
      table: buildDataTable(spec, rows, options),
      degradation,
      message: `Chart mark "${spec.mark}" (spec ${degradation.declaredVersion}) is not supported here; its data is shown as a table`,
    };
  } catch (error) {
    return { kind: 'error', message: messageOf(error, 'Failed to read chart data') };
  }
}

/**
 * Validates a spec and computes its geometry and data table, turning every
 * failure into a message rather than a throw (`Invalid chart spec: …` for an
 * invalid spec): an invalid spec, a data
 * reference with no resolved rows, or an error from {@link computeContext}.
 * A newer `1.N` spec with a mark this interpreter does not know resolves to
 * `unsupported`, which the interpreters render as a visible data table. The
 * bundled Svelte `Chart` component is this function plus SVG.
 */
export function resolveChart(
  spec: unknown,
  box: Box,
  data?: DataRows,
  options?: ResolveChartOptions,
): ResolvedChart {
  const validation = validateSpec(spec);
  if (!validation.ok) {
    return validation.unsupported === undefined
      ? { kind: 'error', message: `Invalid chart spec: ${validation.errors[0] ?? ''}` }
      : resolveUnsupported(
          validation.unsupported.spec,
          validation.unsupported.degradation,
          data,
          options,
        );
  }
  const rows = rowsOf(validation.value.data, data);
  if (rows === undefined) return { kind: 'error', message: MISSING_ROWS };
  try {
    return {
      kind: 'ready',
      spec: validation.value,
      context: computeContext(validation.value, box, rows, options),
      table: buildDataTable(validation.value, rows, options),
      ...(validation.degradation === undefined ? {} : { degradation: validation.degradation }),
    };
  } catch (error) {
    return { kind: 'error', message: messageOf(error, 'Failed to compute chart') };
  }
}

import { isDataRef, validateSpec, type ChartSpec } from '../spec/index.ts';
import { computeContext } from './context.ts';
import type { Box, ChartContext, ComputeContextOptions, DataRows } from './types.ts';

/**
 * The result of {@link resolveChart}: a validated spec and its geometry, or
 * the message an interpreter shows in place of the chart.
 */
export type ResolvedChart =
  | { readonly kind: 'ready'; readonly spec: ChartSpec; readonly context: ChartContext }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Validates a spec and computes its geometry, turning every failure into a
 * message rather than a throw: an invalid spec, a data reference with no
 * resolved rows, or an error from {@link computeContext}. The bundled React,
 * Vue and Svelte `Chart` components are this function plus SVG.
 */
export function resolveChart(
  spec: unknown,
  box: Box,
  data?: DataRows | undefined,
  options?: ComputeContextOptions | undefined,
): ResolvedChart {
  const validation = validateSpec(spec);
  if (!validation.ok) {
    return { kind: 'error', message: `Invalid chart spec: ${validation.errors[0] ?? ''}` };
  }
  if (isDataRef(validation.value.data) && !data) {
    return {
      kind: 'error',
      message: 'Chart data is stored externally; pass resolved rows via the data prop',
    };
  }
  try {
    return {
      kind: 'ready',
      spec: validation.value,
      context: computeContext(validation.value, box, data, options),
    };
  } catch (error) {
    return {
      kind: 'error',
      message: error instanceof Error ? error.message : 'Failed to compute chart',
    };
  }
}

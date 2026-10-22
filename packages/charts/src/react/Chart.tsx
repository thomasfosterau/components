import { computeContext, type ChartContext, type DataRows, type Margins } from '../core/index.ts';
import { isDataRef, validateSpec, type ChartSpec } from '../spec/index.ts';
import { useMemo, type ReactNode } from 'react';
import { Axes } from './axes.tsx';
import { Marks } from './marks.tsx';

const TITLE_COLOR = '#111827';
const FONT_FAMILY = 'system-ui, sans-serif';

/** Props for the {@link Chart} component. */
export interface ChartProps {
  /** The portable chart spec. Runtime-validated, since specs come from documents. */
  readonly spec: ChartSpec;
  /** Resolved data rows. Required when the spec's data is a reference. */
  readonly data?: DataRows | undefined;
  /** Outer width in pixels (the SVG scales to its container via viewBox). */
  readonly width?: number | undefined;
  /** Outer height in pixels. */
  readonly height?: number | undefined;
  /** Margin overrides. */
  readonly margins?: Partial<Margins> | undefined;
  /** Class for the root `<svg>` element, and for the default fallback `<div>`. */
  readonly className?: string | undefined;
  /** Rendered when the spec is invalid or its data is unavailable. */
  readonly fallback?: ReactNode | ((message: string) => ReactNode) | undefined;
}

type ChartState =
  | { readonly kind: 'ready'; readonly spec: ChartSpec; readonly context: ChartContext }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Renders a portable chart spec as SVG.
 *
 * Pure rendering: the component computes geometry via the `/core` entry in a memo
 * and emits SVG elements, so it works identically on the server
 * (renderToString / renderToStaticMarkup) and the client. The SVG uses a
 * viewBox, so it scales to its container with CSS.
 */
export function Chart({
  spec,
  data,
  width = 640,
  height = 360,
  margins,
  className,
  fallback,
}: ChartProps) {
  const state = useMemo<ChartState>(() => {
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
        context: computeContext(
          validation.value,
          { width, height },
          data,
          margins ? { margins } : undefined,
        ),
      };
    } catch (error) {
      return {
        kind: 'error',
        message: error instanceof Error ? error.message : 'Failed to compute chart',
      };
    }
  }, [spec, data, width, height, margins]);

  if (state.kind === 'error') {
    return <ChartFallback message={state.message} fallback={fallback} className={className} />;
  }

  const { dimensions } = state.context;
  const title = state.spec.config?.title;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${dimensions.outer.width} ${dimensions.outer.height}`}
      className={className}
      role="img"
      aria-label={title}
    >
      {title ? (
        <text
          x={dimensions.outer.width / 2}
          y={dimensions.margins.top / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={FONT_FAMILY}
          fontSize={14}
          fontWeight={600}
          fill={TITLE_COLOR}
        >
          {title}
        </text>
      ) : null}
      <g transform={`translate(${dimensions.margins.left},${dimensions.margins.top})`}>
        <Axes ticks={state.context.ticks} plot={dimensions.plot} />
        <Marks geometry={state.context.geometry} />
      </g>
    </svg>
  );
}

function ChartFallback({
  message,
  fallback,
  className,
}: {
  readonly message: string;
  readonly fallback: ChartProps['fallback'];
  readonly className: string | undefined;
}) {
  if (typeof fallback === 'function') return <>{fallback(message)}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return (
    <div className={className} role="alert" data-chart-error="">
      {message}
    </div>
  );
}

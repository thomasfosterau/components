import { resolveChart, type DataRows, type Margins } from '../core/index.ts';
import type { ChartSpec } from '../spec/index.ts';
import { useMemo, type ReactNode } from 'react';
import { Axes } from './axes.tsx';
import { Marks, TreeOutline } from './marks.tsx';

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
  const state = useMemo(
    () => resolveChart(spec, { width, height }, data, { margins }),
    [spec, data, width, height, margins],
  );

  if (state.kind === 'error') {
    return <ChartFallback message={state.message} fallback={fallback} className={className} />;
  }

  const { dimensions, geometry } = state.context;
  const title = state.spec.config?.title;

  const svg = (
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
        {geometry.mark === 'tree' ? null : (
          <Axes ticks={state.context.ticks} plot={dimensions.plot} />
        )}
        <Marks geometry={geometry} />
      </g>
    </svg>
  );
  // A tree's children are presentational inside role="img", so its text
  // alternative (the nested outline) is a sibling of the SVG.
  return geometry.mark === 'tree' ? (
    <>
      {svg}
      <TreeOutline geometry={geometry} />
    </>
  ) : (
    svg
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

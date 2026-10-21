import type { Box, ChartTicks } from '../core/index.ts';

const AXIS_COLOR = '#9ca3af';
const LABEL_COLOR = '#4b5563';
const FONT_FAMILY = 'system-ui, sans-serif';

/** Renders x/y axes with tick marks and labels. */
export function Axes({ ticks, plot }: { readonly ticks: ChartTicks; readonly plot: Box }) {
  return (
    <g data-axes="">
      <line x1={0} y1={plot.height} x2={plot.width} y2={plot.height} stroke={AXIS_COLOR} />
      <line x1={0} y1={0} x2={0} y2={plot.height} stroke={AXIS_COLOR} />
      {(ticks.x ?? []).map((tick, index) => (
        <g key={index} transform={`translate(${tick.position},${plot.height})`}>
          <line y2={6} stroke={AXIS_COLOR} />
          <text
            y={18}
            textAnchor="middle"
            fontFamily={FONT_FAMILY}
            fontSize={11}
            fill={LABEL_COLOR}
          >
            {tick.label}
          </text>
        </g>
      ))}
      {(ticks.y ?? []).map((tick, index) => (
        <g key={index} transform={`translate(0,${tick.position})`}>
          <line x2={-6} stroke={AXIS_COLOR} />
          <text
            x={-10}
            textAnchor="end"
            dominantBaseline="middle"
            fontFamily={FONT_FAMILY}
            fontSize={11}
            fill={LABEL_COLOR}
          >
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
}

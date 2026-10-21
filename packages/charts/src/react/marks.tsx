import { CATEGORICAL_PALETTE, type Geometry } from '../core/index.ts';

const DEFAULT_COLOR = CATEGORICAL_PALETTE[0]!;

/** Renders chart geometry as SVG elements, switching on the mark. */
export function Marks({ geometry }: { readonly geometry: Geometry }) {
  switch (geometry.mark) {
    case 'line':
      return (
        <g data-mark="line">
          {geometry.series
            .filter((series) => series.path.length > 0)
            .map((series) => (
              <path
                key={series.key ?? ''}
                d={series.path}
                fill="none"
                stroke={series.color ?? DEFAULT_COLOR}
                strokeWidth={2}
              />
            ))}
        </g>
      );
    case 'area':
      return (
        <g data-mark="area">
          {geometry.series
            .filter((series) => series.path.length > 0)
            .map((series) => (
              <path
                key={series.key ?? ''}
                d={series.path}
                fill={series.color ?? DEFAULT_COLOR}
                fillOpacity={0.7}
                stroke="none"
              />
            ))}
        </g>
      );
    case 'bar':
      return (
        <g data-mark="bar">
          {geometry.bars.map((bar, index) => (
            <rect
              key={index}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color ?? DEFAULT_COLOR}
            />
          ))}
        </g>
      );
    case 'point':
      return (
        <g data-mark="point">
          {geometry.points.map((point, index) => (
            <circle
              key={index}
              cx={point.cx}
              cy={point.cy}
              r={point.r}
              fill={point.color ?? DEFAULT_COLOR}
            />
          ))}
        </g>
      );
  }
}

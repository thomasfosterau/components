import {
  CATEGORICAL_PALETTE,
  outlineText,
  VISUALLY_HIDDEN_STYLE,
  type Geometry,
  type TreeGeometry,
  type TreeOutlineNode,
} from '../core/index.ts';

const DEFAULT_COLOR = CATEGORICAL_PALETTE[0]!;
const LINK_COLOR = '#9ca3af';
const NODE_TEXT_COLOR = '#111827';
const FONT_FAMILY = 'system-ui, sans-serif';

/** A `tree` mark (spec 1.1): links under the node boxes, each box labelled. */
function TreeMarks({ geometry }: { readonly geometry: TreeGeometry }) {
  return (
    <g data-mark="tree">
      {geometry.links.map((link) => (
        <path key={`${link.from}->${link.to}`} d={link.path} fill="none" stroke={LINK_COLOR} />
      ))}
      {geometry.nodes.map((node) => (
        <g key={node.id}>
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={4}
            fill="#ffffff"
            stroke={node.color ?? DEFAULT_COLOR}
            strokeWidth={1.5}
          />
          <text
            x={node.x + node.width / 2}
            y={node.y + node.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily={FONT_FAMILY}
            fontSize={11}
            fill={NODE_TEXT_COLOR}
          >
            {node.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function OutlineList({ nodes }: { readonly nodes: ReadonlyArray<TreeOutlineNode> }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          {outlineText(node)}
          {node.children.length > 0 ? <OutlineList nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * A tree's text alternative: the hierarchy as a nested list in depth-first
 * order, visually hidden. It sits beside the `role="img"` SVG, whose
 * children are presentational.
 */
export function TreeOutline({ geometry }: { readonly geometry: TreeGeometry }) {
  return (
    <div style={visuallyHidden} data-chart-outline="">
      <OutlineList nodes={geometry.outline} />
    </div>
  );
}

const visuallyHidden = Object.fromEntries(
  VISUALLY_HIDDEN_STYLE.split(';').map((rule) => {
    const [name = '', value = ''] = rule.split(':');
    return [name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), value];
  }),
);

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
    case 'tree':
      return <TreeMarks geometry={geometry} />;
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

import {
  CATEGORICAL_PALETTE,
  outlineText,
  VISUALLY_HIDDEN_STYLE,
  type ChartContext,
  type Tick,
  type TreeGeometry,
  type TreeOutlineNode,
} from '../core/index.ts';

/** Options for {@link renderContextToSvg}. */
export interface RenderSvgOptions {
  /** Chart title rendered above the plot. */
  readonly title?: string | undefined;
  /** Class attribute for the root <svg> element. */
  readonly className?: string | undefined;
}

const AXIS_COLOR = '#9ca3af';
const LABEL_COLOR = '#4b5563';
const TITLE_COLOR = '#111827';
const FONT = 'font-family="system-ui, sans-serif"';
const DEFAULT_COLOR = CATEGORICAL_PALETTE[0]!;

/**
 * Renders a computed ChartContext to an SVG string.
 *
 * Pure string building — no DOM required — so it works in the ProseMirror
 * NodeView (via innerHTML), in server-side rendering, and in headless tests.
 * The SVG uses a viewBox so it scales to its container via CSS.
 */
export function renderContextToSvg(context: ChartContext, options?: RenderSvgOptions): string {
  const { outer, margins } = context.dimensions;
  const parts: string[] = [];

  const classAttr = options?.className ? ` class="${escapeXml(options.className)}"` : '';
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${outer.width} ${outer.height}"${classAttr} role="img">`,
  );

  if (options?.title) {
    parts.push(
      `<text x="${outer.width / 2}" y="${margins.top / 2}" text-anchor="middle" dominant-baseline="middle" ` +
        `${FONT} font-size="14" font-weight="600" fill="${TITLE_COLOR}">${escapeXml(options.title)}</text>`,
    );
  }

  // Plot group: geometry and axes are in plot coordinates.
  parts.push(`<g transform="translate(${margins.left},${margins.top})">`);
  if (context.geometry.mark !== 'tree') parts.push(renderAxes(context));
  parts.push(renderGeometry(context));
  parts.push('</g>');

  parts.push('</svg>');
  return parts.filter((part) => part.length > 0).join('');
}

function renderAxes(context: ChartContext): string {
  const { plot } = context.dimensions;
  const parts: string[] = [];

  // Axis lines.
  parts.push(
    `<line x1="0" y1="${plot.height}" x2="${plot.width}" y2="${plot.height}" stroke="${AXIS_COLOR}"/>`,
  );
  parts.push(`<line x1="0" y1="0" x2="0" y2="${plot.height}" stroke="${AXIS_COLOR}"/>`);

  // X ticks: below the plot.
  for (const tick of context.ticks.x ?? []) {
    parts.push(renderXTick(tick, plot.height));
  }
  // Y ticks: left of the plot.
  for (const tick of context.ticks.y ?? []) {
    parts.push(renderYTick(tick));
  }

  return parts.join('');
}

function renderXTick(tick: Tick, plotHeight: number): string {
  return (
    `<g transform="translate(${tick.position},${plotHeight})">` +
    `<line y2="6" stroke="${AXIS_COLOR}"/>` +
    `<text y="18" text-anchor="middle" ${FONT} font-size="11" fill="${LABEL_COLOR}">${escapeXml(tick.label)}</text>` +
    '</g>'
  );
}

function renderYTick(tick: Tick): string {
  return (
    `<g transform="translate(0,${tick.position})">` +
    `<line x2="-6" stroke="${AXIS_COLOR}"/>` +
    `<text x="-10" text-anchor="end" dominant-baseline="middle" ${FONT} font-size="11" fill="${LABEL_COLOR}">${escapeXml(tick.label)}</text>` +
    '</g>'
  );
}

function renderGeometry(context: ChartContext): string {
  const geometry = context.geometry;
  switch (geometry.mark) {
    case 'line':
      return geometry.series
        .filter((series) => series.path.length > 0)
        .map(
          (series) =>
            `<path d="${series.path}" fill="none" stroke="${series.color ?? DEFAULT_COLOR}" stroke-width="2"/>`,
        )
        .join('');
    case 'area':
      return geometry.series
        .filter((series) => series.path.length > 0)
        .map(
          (series) =>
            `<path d="${series.path}" fill="${series.color ?? DEFAULT_COLOR}" fill-opacity="0.7" stroke="none"/>`,
        )
        .join('');
    case 'bar':
      return geometry.bars
        .map(
          (bar) =>
            `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" fill="${bar.color ?? DEFAULT_COLOR}"/>`,
        )
        .join('');
    case 'tree':
      return renderTree(geometry);
    case 'point':
      return geometry.points
        .map(
          (point) =>
            `<circle cx="${point.cx}" cy="${point.cy}" r="${point.r}" fill="${point.color ?? DEFAULT_COLOR}"/>`,
        )
        .join('');
  }
}

const LINK_COLOR = '#9ca3af';

/** A `tree` mark (spec 1.1): links under the node boxes, each box labelled. */
function renderTree(geometry: TreeGeometry): string {
  const links = geometry.links.map(
    (link) => `<path d="${link.path}" fill="none" stroke="${LINK_COLOR}"/>`,
  );
  const nodes = geometry.nodes.map(
    (node) =>
      `<g><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="4" fill="#ffffff" ` +
      `stroke="${node.color ?? DEFAULT_COLOR}" stroke-width="1.5"/>` +
      `<text x="${node.x + node.width / 2}" y="${node.y + node.height / 2}" text-anchor="middle" dominant-baseline="middle" ` +
      `${FONT} font-size="11" fill="${TITLE_COLOR}">${escapeXml(node.label)}</text></g>`,
  );
  return [...links, ...nodes].join('');
}

function outlineList(nodes: ReadonlyArray<TreeOutlineNode>): string {
  const items = nodes.map(
    (node) =>
      `<li>${escapeXml(outlineText(node))}${node.children.length > 0 ? outlineList(node.children) : ''}</li>`,
  );
  return `<ul>${items.join('')}</ul>`;
}

/**
 * A tree's text alternative as an HTML string: the hierarchy as a nested
 * list in depth-first order, visually hidden. Place it after the SVG from
 * {@link renderContextToSvg}: the SVG is `role="img"`, whose children are
 * presentational. Empty for every other mark.
 */
export function renderTreeOutline(context: ChartContext): string {
  if (context.geometry.mark !== 'tree') return '';
  return `<div style="${VISUALLY_HIDDEN_STYLE}" data-chart-outline="">${outlineList(context.geometry.outline)}</div>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
